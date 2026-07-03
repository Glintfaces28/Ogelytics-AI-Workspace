"""
Stripe billing integration.
Handles checkout sessions, customer portal, and webhooks.

Required env vars:
  STRIPE_SECRET_KEY      — from Stripe dashboard → Developers → API keys
  STRIPE_WEBHOOK_SECRET  — from Stripe dashboard → Developers → Webhooks
  STRIPE_PRO_PRICE_ID    — from Stripe dashboard → Products → Pro plan price ID
  STRIPE_ENTERPRISE_PRICE_ID  — enterprise plan price ID (optional)
  FRONTEND_URL           — already set

How it works:
  1. User clicks "Upgrade" → POST /billing/checkout → returns a Stripe checkout URL
  2. User pays on Stripe's hosted page
  3. Stripe POSTs events to POST /billing/webhook
  4. Webhook updates the user's subscription_plan and subscription_status
  5. User can manage/cancel via POST /billing/portal
"""
import os

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(prefix="/billing", tags=["billing"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRO_PRICE_ID = os.getenv("STRIPE_PRO_PRICE_ID", "")
STRIPE_ENTERPRISE_PRICE_ID = os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

PLAN_PRICE_MAP = {
    "pro": STRIPE_PRO_PRICE_ID,
    "enterprise": STRIPE_ENTERPRISE_PRICE_ID,
}


def _stripe():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing is not configured yet.")
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


# ── Current subscription info ─────────────────────────────────────────────────

@router.get("/status")
def subscription_status(
    current_user: models.User = Depends(get_current_user),
):
    return {
        "plan": current_user.subscription_plan or "free",
        "status": current_user.subscription_status,
        "is_active": current_user.subscription_plan in ("pro", "enterprise")
                     and current_user.subscription_status == "active",
    }


# ── Create checkout session ───────────────────────────────────────────────────

@router.post("/checkout")
def create_checkout(
    plan: str = "pro",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    stripe = _stripe()
    price_id = PLAN_PRICE_MAP.get(plan)
    if not price_id:
        raise HTTPException(status_code=400, detail=f"Unknown plan: {plan}")

    # Create or retrieve Stripe customer
    if current_user.stripe_customer_id:
        customer_id = current_user.stripe_customer_id
    else:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=current_user.username,
            metadata={"user_id": str(current_user.id)},
        )
        customer_id = customer.id
        current_user.stripe_customer_id = customer_id
        db.commit()

    session = stripe.checkout.Session.create(
        customer=customer_id,
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{FRONTEND_URL}/billing/success?session_id={{CHECKOUT_SESSION_ID}}",
        cancel_url=f"{FRONTEND_URL}/billing",
        metadata={"user_id": str(current_user.id), "plan": plan},
    )
    return {"checkout_url": session.url}


# ── Customer portal (manage / cancel) ────────────────────────────────────────

@router.post("/portal")
def customer_portal(
    current_user: models.User = Depends(get_current_user),
):
    stripe = _stripe()
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=400, detail="No billing account found.")

    session = stripe.billing_portal.Session.create(
        customer=current_user.stripe_customer_id,
        return_url=f"{FRONTEND_URL}/billing",
    )
    return {"portal_url": session.url}


# ── Stripe webhook ────────────────────────────────────────────────────────────

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    stripe = _stripe()
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    event_type = event["type"]
    data = event["data"]["object"]

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        _handle_subscription_update(db, data)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(db, data)

    return JSONResponse({"received": True})


def _find_user_by_customer(db: Session, customer_id: str) -> models.User | None:
    return db.query(models.User).filter(
        models.User.stripe_customer_id == customer_id
    ).first()


def _handle_subscription_update(db: Session, subscription: dict):
    user = _find_user_by_customer(db, subscription["customer"])
    if not user:
        return

    plan = "free"
    price_id = None
    items = subscription.get("items", {}).get("data", [])
    if items:
        price_id = items[0].get("price", {}).get("id")

    if price_id == STRIPE_PRO_PRICE_ID:
        plan = "pro"
    elif price_id == STRIPE_ENTERPRISE_PRICE_ID:
        plan = "enterprise"

    user.stripe_subscription_id = subscription["id"]
    user.subscription_plan = plan
    user.subscription_status = subscription["status"]  # active, past_due, canceled…
    db.commit()


def _handle_subscription_deleted(db: Session, subscription: dict):
    user = _find_user_by_customer(db, subscription["customer"])
    if not user:
        return
    user.subscription_plan = "free"
    user.subscription_status = "canceled"
    user.stripe_subscription_id = None
    db.commit()
