from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.routers import projects, meetings
from app import models
import os
from dotenv import load_dotenv

load_dotenv()

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")

# Initialize FastAPI app
app = FastAPI(
    title="Meeting Minutes API",
    description="API for Meeting Minutes application",
    version="1.0.0"
)

# 🔥 FIXED CORS CONFIGURATION 🔥
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (development only)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(projects.router)
app.include_router(meetings.router)

@app.get("/")
def root():
    return {
        "message": "Welcome to Meeting Minutes API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    print("✨ Starting server...")
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True
    )