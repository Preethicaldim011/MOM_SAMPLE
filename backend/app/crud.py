from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import app.models as models
import app.schemas as schemas

# Project CRUD
def get_project(db: Session, project_id: str):
    return db.query(models.Project).filter(models.Project.id == project_id).first()

def get_project_by_name(db: Session, name: str):
    return db.query(models.Project).filter(models.Project.name == name).first()

def get_projects(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Project).offset(skip).limit(limit).all()

def create_project(db: Session, project: schemas.ProjectCreate):
    db_project = models.Project(name=project.name, description=project.description)
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

def update_project(db: Session, project_id: str, project_update: schemas.ProjectUpdate):
    db_project = get_project(db, project_id)
    if db_project:
        for key, value in project_update.dict(exclude_unset=True).items():
            setattr(db_project, key, value)
        db.commit()
        db.refresh(db_project)
    return db_project

def delete_project(db: Session, project_id: str):
    db_project = get_project(db, project_id)
    if db_project:
        db.delete(db_project)
        db.commit()
        return True
    return False

# Meeting CRUD
def get_meeting(db: Session, meeting_id: str):
    return db.query(models.Meeting).filter(models.Meeting.id == meeting_id).first()

def get_meetings(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Meeting).offset(skip).limit(limit).all()

def get_meetings_by_project(db: Session, project_id: str):
    return db.query(models.Meeting).filter(models.Meeting.project_id == project_id).all()

def create_meeting(db: Session, meeting: schemas.MeetingCreate):
    db_meeting = models.Meeting(
        project_id=meeting.project_id,
        phase=meeting.phase,
        title=meeting.title
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    
    # Add meeting points
    for point in meeting.points:
        db_point = models.MeetingPoint(
            meeting_id=db_meeting.id,
            **point.dict()
        )
        db.add(db_point)
    
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

def update_meeting(db: Session, meeting_id: str, meeting_update: schemas.MeetingUpdate):
    db_meeting = get_meeting(db, meeting_id)
    if db_meeting:
        # Update meeting fields
        for key, value in meeting_update.dict(exclude={'points'}, exclude_unset=True).items():
            setattr(db_meeting, key, value)
        
        # Update points
        if meeting_update.points:
            # Delete existing points
            db.query(models.MeetingPoint).filter(models.MeetingPoint.meeting_id == meeting_id).delete()
            
            # Add updated points
            for point in meeting_update.points:
                db_point = models.MeetingPoint(
                    meeting_id=meeting_id,
                    **point.dict(exclude={'id'})
                )
                db.add(db_point)
        
        db.commit()
        db.refresh(db_meeting)
    return db_meeting

def delete_meeting(db: Session, meeting_id: str):
    db_meeting = get_meeting(db, meeting_id)
    if db_meeting:
        db.delete(db_meeting)
        db.commit()
        return True
    return False

# Search function
def search_meetings(db: Session, search_term: str):
    return db.query(models.Meeting).join(models.MeetingPoint).filter(
        or_(
            models.Meeting.phase.ilike(f"%{search_term}%"),
            models.Meeting.title.ilike(f"%{search_term}%"),
            models.MeetingPoint.discussion_point.ilike(f"%{search_term}%"),
            models.MeetingPoint.function.ilike(f"%{search_term}%"),
            models.MeetingPoint.responsibility.ilike(f"%{search_term}%")
        )
    ).distinct().all()