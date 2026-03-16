from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app import crud, schemas
from app.database import get_db

router = APIRouter(prefix="/meetings", tags=["meetings"])

@router.post("/", response_model=schemas.Meeting)
def create_meeting(meeting: schemas.MeetingCreate, db: Session = Depends(get_db)):
    return crud.create_meeting(db=db, meeting=meeting)

@router.get("/", response_model=List[schemas.Meeting])
def read_meetings(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    meetings = crud.get_meetings(db, skip=skip, limit=limit)
    return meetings

@router.get("/search/", response_model=List[schemas.Meeting])
def search_meetings(search_term: str, db: Session = Depends(get_db)):
    meetings = crud.search_meetings(db, search_term=search_term)
    return meetings

@router.get("/project/{project_id}", response_model=List[schemas.Meeting])
def read_meetings_by_project(project_id: str, db: Session = Depends(get_db)):
    meetings = crud.get_meetings_by_project(db, project_id=project_id)
    return meetings

@router.get("/{meeting_id}", response_model=schemas.Meeting)
def read_meeting(meeting_id: str, db: Session = Depends(get_db)):
    db_meeting = crud.get_meeting(db, meeting_id=meeting_id)
    if db_meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db_meeting

@router.put("/{meeting_id}", response_model=schemas.Meeting)
def update_meeting(meeting_id: str, meeting: schemas.MeetingUpdate, db: Session = Depends(get_db)):
    db_meeting = crud.update_meeting(db, meeting_id=meeting_id, meeting_update=meeting)
    if db_meeting is None:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return db_meeting

@router.delete("/{meeting_id}")
def delete_meeting(meeting_id: str, db: Session = Depends(get_db)):
    success = crud.delete_meeting(db, meeting_id=meeting_id)
    if not success:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return {"message": "Meeting deleted successfully"}