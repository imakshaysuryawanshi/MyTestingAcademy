from fastapi import APIRouter
from pydantic import BaseModel
from services.config_manager import update_jira_config, update_llm_config, is_configured, load_config
from typing import Optional

router = APIRouter()

class JiraUpdateReq(BaseModel):
    jira_url: str
    email: str
    api_token: str

class LLMUpdateReq(BaseModel):
    provider: str
    model: str
    api_key: str
    base_url: Optional[str] = None

@router.get("/status")
def get_status():
    return is_configured()

@router.get("/config")
def get_config():
    # Only return non-sensitive elements for the dropdowns
    conf = load_config()
    return {
        "jira_url": conf.jira.jira_url,
        "email": conf.jira.email,
        "provider": conf.llm.provider,
        "model": conf.llm.model,
        "base_url": conf.llm.base_url
    }

@router.post("/jira")
def post_jira(req: JiraUpdateReq):
    update_jira_config(req.model_dump())
    return {"status": "success"}

@router.post("/llm")
def post_llm(req: LLMUpdateReq):
    update_llm_config(req.model_dump())
    return {"status": "success"}
