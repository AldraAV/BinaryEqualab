"""
Binary EquaLab - Worksheets API

CRUD operations for user calculation worksheets.
Requires Supabase table: worksheets
"""
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from auth import require_auth, User, get_supabase

router = APIRouter(prefix="/api/worksheets", tags=["worksheets"])

# Models
class WorksheetItem(BaseModel):
    expression: str
    result: str
    timestamp: Optional[str] = None

class WorksheetCreate(BaseModel):
    title: str
    items: List[WorksheetItem] = []

class WorksheetUpdate(BaseModel):
    title: Optional[str] = None
    items: Optional[List[WorksheetItem]] = None

class Worksheet(BaseModel):
    id: str
    user_id: str
    title: str
    items: List[WorksheetItem]
    created_at: str
    updated_at: str

# Routes
@router.get("", response_model=List[Worksheet])
async def list_worksheets(user: User = Depends(require_auth)):
    """List all worksheets for the authenticated user."""
    try:
        supabase = get_supabase()
        response = supabase.table("worksheets").select("*").eq("user_id", user.id).order("updated_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("", response_model=Worksheet)
async def create_worksheet(data: WorksheetCreate, user: User = Depends(require_auth)):
    """Create a new worksheet."""
    try:
        supabase = get_supabase()
        now = datetime.utcnow().isoformat()
        worksheet_data = {
            "user_id": user.id,
            "title": data.title,
            "items": [item.dict() for item in data.items],
            "created_at": now,
            "updated_at": now
        }
        response = supabase.table("worksheets").insert(worksheet_data).execute()
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{worksheet_id}", response_model=Worksheet)
async def get_worksheet(worksheet_id: str, user: User = Depends(require_auth)):
    """Get a specific worksheet."""
    try:
        supabase = get_supabase()
        response = supabase.table("worksheets").select("*").eq("id", worksheet_id).eq("user_id", user.id).single().execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{worksheet_id}", response_model=Worksheet)
async def update_worksheet(worksheet_id: str, data: WorksheetUpdate, user: User = Depends(require_auth)):
    """Update a worksheet."""
    try:
        supabase = get_supabase()
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        if data.title is not None:
            update_data["title"] = data.title
        if data.items is not None:
            update_data["items"] = [item.dict() for item in data.items]
        
        response = supabase.table("worksheets").update(update_data).eq("id", worksheet_id).eq("user_id", user.id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Worksheet not found")
        return response.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{worksheet_id}")
async def delete_worksheet(worksheet_id: str, user: User = Depends(require_auth)):
    """Delete a worksheet."""
    try:
        supabase = get_supabase()
        supabase.table("worksheets").delete().eq("id", worksheet_id).eq("user_id", user.id).execute()
        return {"message": "Worksheet deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
