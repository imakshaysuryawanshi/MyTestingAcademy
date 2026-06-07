from fastapi import APIRouter, HTTPException
import httpx
from pydantic import BaseModel
import base64
from services.config_manager import load_config
import json

router = APIRouter()

class FetchIssueRequest(BaseModel):
    jira_id: str

def get_auth_header(email: str, api_token: str) -> dict:
    auth_str = f"{email}:{api_token}"
    b64_auth_str = base64.b64encode(auth_str.encode()).decode()
    return {"Authorization": f"Basic {b64_auth_str}", "Accept": "application/json"}

def extract_adf_text(node: dict | list | None, depth: int = 0) -> str:
    """
    Recursively extract plain text from an Atlassian Document Format (ADF) node or list of nodes.
    """
    if node is None:
        return ""
    
    # Handle list of nodes (common for 'content' fields or top-level list inputs)
    if isinstance(node, list):
        return "".join(extract_adf_text(item, depth + 1) for item in node)

    if not isinstance(node, dict):
        return str(node)

    node_type = node.get("type", "")
    content = node.get("content", [])
    text = node.get("text", "")
    
    # Extract text from children
    children_text = extract_adf_text(content, depth + 1)

    if node_type == "text":
        return text
    elif node_type == "hardBreak":
        return "\n"
    elif node_type == "rule":
        return "\n---\n"
    elif node_type == "paragraph":
        return children_text.strip() + "\n"
    elif node_type in ("heading",):
        return children_text.strip() + "\n"
    elif node_type == "bulletList":
        return children_text
    elif node_type == "orderedList":
        return children_text
    elif node_type == "listItem":
        return "  • " + children_text.strip() + "\n"
    elif node_type == "codeBlock":
        return f"```\n{children_text.strip()}\n```\n"
    elif node_type == "doc":
        return children_text
    else:
        return children_text

def safe_text(text: str) -> str:
    """Ensure characters don't break Windows stdout/encodings."""
    if not text: return ""
    return text.encode("utf-8", errors="replace").decode("utf-8")

def find_acceptance_criteria(fields: dict) -> str:
    """
    Exhaustively search common and custom field patterns for Acceptance Criteria.
    """
    # Key candidates based on common Jira configurations
    candidates = [
        "customfield_10016", 
        "customfield_10020",
        "customfield_10014",
        "customfield_10034",
        "customfield_10100",
        "acceptance_criteria",
        "Acceptance Criteria",
    ]
    
    # Try direct key matching first
    for key in candidates:
        val = fields.get(key)
        if val:
            # If it's ADF doc
            if isinstance(val, dict) and val.get("type") == "doc":
                return extract_adf_text(val).strip()
            # If it's already a string
            if isinstance(val, str) and val.strip():
                return val.strip()

    # Heuristic: search all custom fields for values that look like AC lists
    for key, val in fields.items():
        if key.startswith("customfield_") and val:
            if isinstance(val, dict) and val.get("type") == "doc":
                text = extract_adf_text(val).strip()
                # If looks like a point-wise list or starts with specific markers
                if len(text) > 20 and ("•" in text or "1." in text or "-" in text):
                    return text
    
    return ""

@router.post("/test-connection")
async def test_connection():
    config = load_config()
    if not config.jira.jira_url or not config.jira.email or not config.jira.api_token:
        raise HTTPException(status_code=400, detail="Jira credentials missing")

    try:
        url = f"{config.jira.jira_url.rstrip('/')}/rest/api/3/myself"
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, headers=get_auth_header(config.jira.email, config.jira.api_token))
            if resp.status_code == 200:
                return {"status": "success"}
            raise HTTPException(status_code=resp.status_code, detail="Auth failed")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/fetch-issue")
async def fetch_issue(req: FetchIssueRequest):
    config = load_config()
    try:
        url = f"{config.jira.jira_url.rstrip('/')}/rest/api/3/issue/{req.jira_id}"
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(url, headers=get_auth_header(config.jira.email, config.jira.api_token))

            if resp.status_code == 200:
                data = resp.json()
                fields = data.get("fields", {})

                # Summary
                summary = safe_text(fields.get("summary", ""))

                # Description
                description_raw = fields.get("description")
                description = safe_text(extract_adf_text(description_raw).strip())

                # Acceptance Criteria
                acceptance_criteria = safe_text(find_acceptance_criteria(fields))

                # If no AC found, look for "Acceptance Criteria" heading inside the description
                if not acceptance_criteria:
                    if "Acceptance Criteria" in description:
                        # Crude split if embedded
                        try:
                            parts = description.split("Acceptance Criteria", 1)
                            acceptance_criteria = parts[1].strip()
                        except: pass

                # Final fallback
                if not acceptance_criteria:
                    acceptance_criteria = description

                return {
                    "jira_id": req.jira_id,
                    "summary": summary,
                    "description": description,
                    "acceptance_criteria": acceptance_criteria,
                    "issue_type": fields.get("issuetype", {}).get("name", ""),
                    "priority": fields.get("priority", {}).get("name", "Medium"),
                    "components": [c.get("name") for c in fields.get("components", [])]
                }
            else:
                raise HTTPException(status_code=resp.status_code, detail=f"Jira Error: {resp.text[:100]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
