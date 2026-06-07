from pydantic import BaseModel, Field
from typing import List, Optional

class TestCase(BaseModel):
    # Fully elastic schema to avoid Ralphloop/Instructor validation crashes
    id: Optional[str] = Field(description="Unique test case ID")
    title: str = Field(..., description="Short test case title")
    type: Optional[str] = Field(default="Functional", description="Positive | Negative | Edge | Boundary | Security")
    priority: Optional[str] = Field(default="P1", description="P0 | P1 | P2")
    preconditions: Optional[str] = Field(default="N/A", description="Preconditions")
    steps: List[str] = Field(..., description="Clear execution steps")
    test_data: Optional[str] = Field(default="N/A", description="Test data")
    expected_result: str = Field(..., description="Expected outcome")
    linked_jira_id: Optional[str] = Field(default="", description="Linked Jira ID")

class TestCasesResponse(BaseModel):
    test_cases: List[TestCase]

class APITestCase(BaseModel):
    id: Optional[str] = Field(None)
    title: str = Field(...)
    cat: Optional[str] = Field(default="Functional")
    desc: Optional[str] = Field(default="")
    pre: Optional[str] = Field(default="N/A")
    stepsArr: List[str] = Field(...)
    expected: str = Field(...)
    Test_Data: Optional[str] = Field(default="N/A")
    prio: Optional[str] = Field(default="P1")
    status: Optional[str] = Field(default="Ready")
    linked_jira_id: Optional[str] = Field(default="", description="Linked Jira ID")

class APITestCasesResponse(BaseModel):
    test_cases: List[APITestCase]

class JiraCredentials(BaseModel):
    jira_url: str
    email: str
    api_token: str

class GenerateRequest(BaseModel):
    jira_id: str
    template_type: str
    summary: str
    description: str
    acceptance_criteria: str
    issue_type: str
    priority: str
    components: str
    custom_prompt: Optional[str] = None
