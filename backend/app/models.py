from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

# Function to generate UUID
def generate_uuid():
    return str(uuid.uuid4())

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    meetings = relationship("Meeting", back_populates="project", cascade="all, delete-orphan")

class Meeting(Base):
    __tablename__ = "meetings"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    phase = Column(String, nullable=False)
    title = Column(String)
    date = Column(DateTime(timezone=True), server_default=func.now())
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    project = relationship("Project", back_populates="meetings")
    points = relationship("MeetingPoint", back_populates="meeting", cascade="all, delete-orphan")

class MeetingPoint(Base):
    __tablename__ = "meeting_points"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    meeting_id = Column(String, ForeignKey("meetings.id", ondelete="CASCADE"), nullable=False)
    sno = Column(Integer)
    function = Column(String)
    project_name = Column(String)
    criticality = Column(String, default="Medium")
    discussion_point = Column(Text, nullable=False)
    responsibility = Column(String)
    target = Column(String)
    remainder = Column(String)
    status = Column(String, default="Pending")
    action_taken = Column(String, default="No")
    speaker = Column(String, default="Speech")
    timestamp = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    meeting = relationship("Meeting", back_populates="points")