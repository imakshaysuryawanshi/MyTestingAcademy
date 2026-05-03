import os
import time
from dataclasses import dataclass
from typing import Optional
from groq import Groq

MAX_RETRIES = 3
DEFAULT_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")


@dataclass
class LLMResponse:
    text: str
    model: str
    latency_ms: float
    attempts: int
    error: Optional[str] = None


class RalphloopError(Exception):
    """Raised when all Ralphloop retries are exhausted."""
    pass


def get_groq_client(api_key: Optional[str] = None) -> Groq:
    key = api_key or os.getenv("GROQ_API_KEY")
    if not key:
        raise ValueError("GROQ_API_KEY not found. Provide it in the sidebar.")
    
    base_url = os.getenv("GROQ_BASE_URL")
    if base_url:
        return Groq(api_key=key, base_url=base_url)
    return Groq(api_key=key)


def generate(
    prompt: str,
    system_prompt: str = "You are an expert QA engineer assistant.",
    model: str = DEFAULT_MODEL,
    api_key: Optional[str] = None,
    temperature: float = 0.3,
    max_tokens: int = 2048,
) -> LLMResponse:
    """
    Ralphloop: retries up to MAX_RETRIES times.
    On failure, injects error context back into the prompt for self-correction.
    """
    client = get_groq_client(api_key)
    current_prompt = prompt
    last_error: Optional[str] = None
    start_total = time.time()

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            t0 = time.time()
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": current_prompt},
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            latency_ms = (time.time() - t0) * 1000
            text = response.choices[0].message.content
            if not text or not text.strip():
                raise ValueError("LLM returned empty response")

            return LLMResponse(
                text=text.strip(),
                model=model,
                latency_ms=round(latency_ms, 1),
                attempts=attempt,
            )
        except Exception as e:
            last_error = str(e)
            if attempt < MAX_RETRIES:
                # Ralphloop: feed error back as context
                current_prompt = (
                    f"{prompt}\n\n"
                    f"[RALPHLOOP RETRY {attempt}/{MAX_RETRIES}]\n"
                    f"Previous attempt failed: {last_error}\n"
                    f"Please provide a complete, valid response."
                )

    raise RalphloopError(
        f"LLM failed after {MAX_RETRIES} attempts. Last error: {last_error}"
    )
