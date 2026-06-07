import os
import yaml

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
    name_map = {
        "accessibility / a11y": "a11y",
        "localization / l10n": "l10n",
        "smoke testing": "smoke",
        "security / penetration": "security",
        "edge cases": "edge",
        "api testing": "api"
    }
    key = template_type.lower().strip()
    filename = name_map.get(key, key.split()[0])
    
    template_path = os.path.join(os.path.dirname(__file__), '..', 'templates', f'{filename}.yml')
    if os.path.exists(template_path):
        with open(template_path, 'r') as f:
            return yaml.safe_load(f)
    return {}

def construct_prompt(req):
    template = load_template(req.template_type)
    coverage_rules = template.get('coverage', '')
    
    if req.template_type.lower() == "api":
        return f"""
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
        
    return prompt
