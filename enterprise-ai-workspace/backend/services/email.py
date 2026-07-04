import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Email, Mail

SENDGRID_API_KEY = os.getenv("SENDGRID_API_KEY", "")
SENDGRID_FROM_EMAIL = os.getenv("SENDGRID_FROM_EMAIL", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def is_configured(value: str, placeholder: str) -> bool:
    return bool(value and value != placeholder)


def send_welcome_email(recipient_email: str, username: str) -> bool:
    dashboard_url = f"{FRONTEND_URL}/dashboard"

    subject = "Welcome to Ogelytics AI Workspace! 🎉"
    body_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
            <!-- Header -->
            <tr><td style="background:#4F46E5;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">Ogelytics AI Workspace</h1>
              <p style="margin:8px 0 0;color:#C7D2FE;font-size:14px;">Your AI-powered document intelligence platform</p>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:40px;">
              <h2 style="margin:0 0 8px;color:#111827;font-size:22px;">Welcome, {username}! 👋</h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                Your account is ready. You can now upload documents and get instant AI-powered answers.
              </p>
              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
                <tr>
                  <td style="background:#F5F3FF;border-radius:8px;padding:16px;width:30%;vertical-align:top;text-align:center;">
                    <div style="font-size:28px;">📄</div>
                    <p style="margin:8px 0 0;color:#4F46E5;font-size:13px;font-weight:700;">Upload Docs</p>
                    <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">PDF, DOCX and more</p>
                  </td>
                  <td style="width:4%;"></td>
                  <td style="background:#F5F3FF;border-radius:8px;padding:16px;width:30%;vertical-align:top;text-align:center;">
                    <div style="font-size:28px;">🤖</div>
                    <p style="margin:8px 0 0;color:#4F46E5;font-size:13px;font-weight:700;">Ask AI</p>
                    <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Get instant answers</p>
                  </td>
                  <td style="width:4%;"></td>
                  <td style="background:#F5F3FF;border-radius:8px;padding:16px;width:30%;vertical-align:top;text-align:center;">
                    <div style="font-size:28px;">📊</div>
                    <p style="margin:8px 0 0;color:#4F46E5;font-size:13px;font-weight:700;">Analytics</p>
                    <p style="margin:4px 0 0;color:#6B7280;font-size:12px;">Track your usage</p>
                  </td>
                </tr>
              </table>
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr><td style="border-radius:8px;background:#4F46E5;text-align:center;">
                  <a href="{dashboard_url}"
                     style="display:inline-block;padding:14px 40px;color:#ffffff;font-size:15px;
                            font-weight:700;text-decoration:none;border-radius:8px;">
                    Go to Dashboard →
                  </a>
                </td></tr>
              </table>
              <p style="margin:28px 0 0;color:#6B7280;font-size:13px;line-height:1.6;text-align:center;">
                Questions? Just reply to this email — we're happy to help.
              </p>
            </td></tr>
            <!-- Footer -->
            <tr><td style="background:#F9FAFB;padding:24px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">
                © 2026 Ogelytics AI Workspace. All rights reserved.<br>
                You are receiving this email because you created an account.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    body_text = (
        f"Welcome to Ogelytics AI Workspace, {username}!\n\n"
        f"Your account is ready. Upload documents and get instant AI-powered answers.\n\n"
        f"Go to your dashboard: {dashboard_url}\n\n"
        f"© 2026 Ogelytics AI Workspace"
    )

    if not (
        is_configured(SENDGRID_API_KEY, "your_sendgrid_api_key_here")
        and is_configured(SENDGRID_FROM_EMAIL, "verified_sender@example.com")
    ):
        print("SendGrid is not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.")
        return False

    try:
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "Ogelytics AI Workspace"),
            to_emails=recipient_email,
            subject=subject,
            html_content=body_html,
            plain_text_content=body_text,
        )
        SendGridAPIClient(SENDGRID_API_KEY).send(message)
        return True
    except Exception as e:
        print(f"SendGrid welcome email failed: {e}")
        return False


def send_password_reset_email(recipient_email: str, reset_token: str) -> bool:
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"

    subject = "Reset your Ogelytics AI Workspace password"
    body_html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
    <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
        <tr><td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
            <!-- Header -->
            <tr><td style="background:#4F46E5;padding:32px 40px;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Ogelytics AI Workspace</h1>
            </td></tr>
            <!-- Body -->
            <tr><td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">Reset your password</h2>
              <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.6;">
                We received a request to reset the password for your account. Click the button below to create a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr><td style="border-radius:8px;background:#4F46E5;">
                  <a href="{reset_link}"
                     style="display:inline-block;padding:14px 32px;color:#ffffff;font-size:15px;
                            font-weight:700;text-decoration:none;border-radius:8px;">
                    Reset Password
                  </a>
                </td></tr>
              </table>
              <p style="margin:32px 0 0;color:#6B7280;font-size:13px;line-height:1.6;">
                If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.
              </p>
              <p style="margin:16px 0 0;color:#9CA3AF;font-size:12px;">
                Or paste this link in your browser:<br>
                <a href="{reset_link}" style="color:#4F46E5;word-break:break-all;">{reset_link}</a>
              </p>
            </td></tr>
            <!-- Footer -->
            <tr><td style="background:#F9FAFB;padding:24px 40px;border-top:1px solid #E5E7EB;">
              <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;">
                © 2026 Ogelytics AI Workspace. All rights reserved.<br>
                You are receiving this email because a password reset was requested for your account.
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
    """
    body_text = (
        f"Password Reset — Ogelytics AI Workspace\n\n"
        f"We received a request to reset your password.\n\n"
        f"Reset your password here:\n{reset_link}\n\n"
        f"This link expires in 1 hour.\n\n"
        f"If you didn't request this, ignore this email — your password won't change."
    )

    if not (
        is_configured(SENDGRID_API_KEY, "your_sendgrid_api_key_here")
        and is_configured(SENDGRID_FROM_EMAIL, "verified_sender@example.com")
    ):
        print("SendGrid is not configured. Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL.")
        return False

    try:
        message = Mail(
            from_email=Email(SENDGRID_FROM_EMAIL, "Ogelytics AI Workspace"),
            to_emails=recipient_email,
            subject=subject,
            html_content=body_html,
            plain_text_content=body_text,
        )
        SendGridAPIClient(SENDGRID_API_KEY).send(message)
        return True
    except Exception as e:
        print(f"SendGrid email send failed: {e}")
        return False
