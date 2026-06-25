from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Team, TeamMember, User
from schemas import TeamCreate, TeamMemberAdd, TeamMemberOut, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamOut, status_code=201)
def create_team(
    data: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Team).filter(Team.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Team name already taken")

    team = Team(name=data.name, description=data.description, owner_id=current_user.id)
    db.add(team)
    db.commit()
    db.refresh(team)

    member = TeamMember(team_id=team.id, user_id=current_user.id, role="admin")
    db.add(member)
    db.commit()

    return team


@router.get("", response_model=list[TeamOut])
def list_teams(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    memberships = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).all()
    team_ids = [m.team_id for m in memberships]
    return db.query(Team).filter(Team.id.in_(team_ids)).all()


@router.get("/{team_id}", response_model=TeamOut)
def get_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this team")

    return team


@router.post("/{team_id}/members", response_model=TeamMemberOut, status_code=201)
def add_member(
    team_id: int,
    data: TeamMemberAdd,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    caller = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
    ).first()
    if not caller or caller.role != "admin":
        raise HTTPException(status_code=403, detail="Only team admins can add members")

    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    already_member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == data.user_id,
    ).first()
    if already_member:
        raise HTTPException(status_code=400, detail="User is already a member")

    member = TeamMember(team_id=team_id, user_id=data.user_id, role=data.role)
    db.add(member)
    db.commit()
    db.refresh(member)

    return member


@router.delete("/{team_id}/members/{user_id}", status_code=204)
def remove_member(
    team_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    caller = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == current_user.id,
    ).first()
    if not caller or caller.role != "admin":
        raise HTTPException(status_code=403, detail="Only team admins can remove members")

    if user_id == team.owner_id:
        raise HTTPException(status_code=400, detail="Cannot remove the team owner")

    member = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.user_id == user_id,
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(member)
    db.commit()


@router.delete("/{team_id}", status_code=204)
def delete_team(
    team_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team owner can delete the team")

    db.query(TeamMember).filter(TeamMember.team_id == team_id).delete()
    db.delete(team)
    db.commit()
