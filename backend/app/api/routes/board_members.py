from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_db
from app.models.board_member import BoardMember
from app.schemas.board_member import BoardMemberList, BoardMemberPublic

router = APIRouter(prefix="/board-members", tags=["board-members"])


@router.get("", response_model=BoardMemberList)
def list_board_members(db: Session = Depends(get_db)) -> BoardMemberList:
    items = db.scalars(
        select(BoardMember)
        .where(BoardMember.is_published.is_(True))
        .order_by(BoardMember.sort_order, BoardMember.id)
    ).all()
    return BoardMemberList(
        items=[BoardMemberPublic.model_validate(item) for item in items],
        total=len(items),
    )
