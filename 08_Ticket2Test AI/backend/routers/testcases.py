from fastapi import APIRouter, HTTPException
from models import GenerateRequest, TestCasesResponse
from services.llm_service import generate_test_cases_from_llm
from services.config_manager import load_config
import os
import yaml

router = APIRouter()

# Optimized GSD System Prompt (Senior QA lead)
SYSTEM_PROMPT = """You are a Senior QA Automation Lead. 
TASK: Generate structured, comprehensive test cases from Jira issue details.
FORMAT: Return ONLY a JSON object matching the requested schema.
VOLUME: Minimum 8-15 distinct cases (scale with epic complexity).
RULES:
1. GSD MODE: No conversational filler or meta-talk.
2. Terminology: Use 'Test Cases' strictly (NOT 'Scenarios').
3. Coverage: Positive, Negative, Boundary, Edge, and Security cases required.
4. Diversity: Ensure zero logical duplicate cases.
5. Conciseness: Titles < 12 words; steps are short and imperative.
6. Static IDs: All cases will be mapped to the Jira ID in the UI.
"""

def load_template(template_type: str):
    # Mapping friendly names to filenames if needed
    name_map = {
        "accessibility / a11y": "a11y",
        "localization / l10n": "l10n",
        "smoke testing": "smoke",
        "security / penetration": "security",
        "edge cases": "edge",
        "api testing": "api"
    }
    key = template_type.lower().strip()
    filename = name_map.get(key, key.split()[0]) # fallback to first word
    
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', f'{filename}.yml')
    if os.path.exists(template_path):
        with open(template_path, 'r') as f:
            return yaml.safe_load(f)
    return {}

@router.post("/generate", response_model=TestCasesResponse)
async def generate_testcases(req: GenerateRequest):
    try:
        # Load Template Specific Rules
        template = load_template(req.template_type)
        coverage_rules = template.get('coverage', '')
        
        if req.template_type.lower() == "api":
            prompt = f"""
# Role: Senior API QA Engineer
# Objective: Generate manual API test cases for tabular dashboard.
# Rules: TID: ATC-001+, No 'N/A', match schema.
# Input:
Jira ID: {req.jira_id}
Summary: {req.summary}
Description: {req.description}
AC: {req.acceptance_criteria}
Issue Type: {req.issue_type}
Priority: {req.priority}
"""
        else:
            prompt = f"{SYSTEM_PROMPT}\n"
            prompt += f"### CONTEXT\n"
            prompt += f"Jira: {req.jira_id} | Type: {req.template_type}\n"
            prompt += f"Summary: {req.summary}\n"
            prompt += f"Description: {req.description}\n"
            prompt += f"AC: {req.acceptance_criteria}\n"
            
            if coverage_rules:
                prompt += f"### TYPE-SPECIFIC RULES\n{coverage_rules}\n"
            
            if req.custom_prompt:
                prompt += f"### USER CUSTOM INSTRUCTIONS (PRIORITY)\n{req.custom_prompt}\n"
        
        # Decide model from Config
        config = load_config()
        if not config.llm.model:
            raise HTTPException(status_code=400, detail="LLM Model is not configured")
            
        provider = config.llm.provider.strip().lower()
        model = config.llm.model.strip()
        model_name = model if provider == "openai" or "/" in model else f"{provider}/{model}"
        
        # Generation (GSD pattern)
        is_api = req.template_type.lower() == "api"
        response = generate_test_cases_from_llm(model=model_name, prompt=prompt, is_api=is_api)
        
        # Sequential ID Post-processing (Ralphloop pattern)
        prefix = "ATC" if is_api else "TC"
        for i, tc in enumerate(response.test_cases):
            tc.id = f"{prefix}_{str(i+1).zfill(3)}"
            tc.linked_jira_id = req.jira_id
                
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
