from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models.database import get_db

import time

router = APIRouter()

# Track when service started
start_time = time.time()


@router.get("/health")
def health_check():
   """Basic health check - is the service running?"""
   return {
      "status": "healthy",
      "service": "product-service",
      "uptime": round(time.time() - start_time, 2)
   }


@router.get("/ready")
def readiness_check(db: Session = Depends(get_db)):
   """Readiness check - can the service handle requests?"""
   try:
      # Test database connection
      db.execute(text("SELECT 1"))
      db_status = "connected"
   except Exception as e:
      db_status = f"error: {str(e)}"

   is_ready = db_status == "connected"

   return {
      "status": "ready" if is_ready else "not_ready",
      "database": db_status
   }
