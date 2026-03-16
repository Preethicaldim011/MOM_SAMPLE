from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Meeting Point Schemas
class MeetingPointBase(BaseModel):
    sno: Optional[int] = None
    function: str = ""
    project_name: str = ""
    criticality: str = "Medium"
    discussion_point: str
    responsibility: str = ""
    target: str = ""
    remainder: str = ""
    status: str = "Pending"
    action_taken: str = "No"
    speaker: str = "Speech"
    timestamp: Optional[str] = None

class MeetingPointCreate(MeetingPointBase):
    pass

class MeetingPointUpdate(MeetingPointBase):
    id: str

class MeetingPoint(MeetingPointBase):
    id: str
    meeting_id: str
    created_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Meeting Schemas
class MeetingBase(BaseModel):
    phase: str
    title: Optional[str] = None
    date: Optional[datetime] = None

class MeetingCreate(MeetingBase):
    project_id: str
    points: List[MeetingPointCreate] = []

class MeetingUpdate(MeetingBase):
    id: str
    points: List[MeetingPointUpdate] = []

class Meeting(MeetingBase):
    id: str
    project_id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    points: List[MeetingPoint] = []
    
    class Config:
        from_attributes = True

# Project Schemas
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(ProjectBase):
    id: str

class Project(ProjectBase):
    id: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    meetings: List[Meeting] = []
    
    class Config:
        from_attributes = True
