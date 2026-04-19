import litellm
import instructor
from models import TestCasesResponse, APITestCasesResponse
import os
from dotenv import load_dotenv

load_dotenv()

# We patch litellm completion with instructor for structured output
client = instructor.from_litellm(litellm.completion)

def generate_test_cases_from_llm(model: str, prompt: str, is_api: bool = False):
    """Uses Instructor for strict JSON scheme and Litellm for provider abstraction."""
    try:
        # Ralphloop Optimization: Instructor automatically handles validation retries (max_retries=2).
        # We explicitly rely on it to catch JSON Decode or Pydantic ValidationError and rewrite prompt.
        response_model = APITestCasesResponse if is_api else TestCasesResponse
        
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": prompt}
            ],
            response_model=response_model,
            max_tokens=2048,
            max_retries=2, # Ralphloop self-correction hook
        )
        return response
    except Exception as e:
        # Avoid printing full exception if it contains unencodable chars for Windows console
        print(f"LLM Generation Error: {str(e).encode('ascii', 'ignore').decode()}")
        raise e
