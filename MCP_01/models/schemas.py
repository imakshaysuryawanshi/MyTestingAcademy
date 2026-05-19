from pydantic import BaseModel
from typing import Optional, List

class CityReport(BaseModel):
    city_name: str
    population: int
    country: str
    report_status: str

class BrowserSessionData(BaseModel):
    session_id: str
    url: str
    timestamp: str
    active_tabs: int
