from pydantic import BaseModel
from typing import List, Optional

class GroupCreate(BaseModel):
    Group_Name: str	
    Budget: str	
    Travel_Style: str	
    Destinations_Planned: Optional[List[str]] = None	
    Group_Interest: List[str]	
    Current_Members: int
    Status: str	
    Members: Optional[List[str]] = []

