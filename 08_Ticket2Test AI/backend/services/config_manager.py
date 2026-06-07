import json
import os
from pydantic import BaseModel
from typing import Optional

CONFIG_FILE = os.path.join(os.path.dirname(__file__), '..', 'config.json')

class JiraConfig(BaseModel):
    jira_url: str = ""
    email: str = ""
    api_token: str = ""

class LLMConfig(BaseModel):
    provider: str = "openai"  # openai, anthropic, ollama, etc.
    model: str = "gpt-4o"
    api_key: str = ""
    base_url: Optional[str] = None

class AppConfig(BaseModel):
    jira: JiraConfig = JiraConfig()
    llm: LLMConfig = LLMConfig()

def load_config() -> AppConfig:
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                data = json.load(f)
                return AppConfig(**data)
        except Exception:
            pass
    return AppConfig()

def save_config(config: AppConfig):
    with open(CONFIG_FILE, 'w') as f:
        json.dump(config.model_dump(), f, indent=4)

def update_jira_config(jira_data: dict) -> AppConfig:
    conf = load_config()
    for k, v in jira_data.items():
        if hasattr(conf.jira, k):
            setattr(conf.jira, k, v)
    save_config(conf)
    return conf

def update_llm_config(llm_data: dict) -> AppConfig:
    conf = load_config()
    for k, v in llm_data.items():
        if hasattr(conf.llm, k) and v:  # Only overwrite non-empty values
            setattr(conf.llm, k, v)
        elif hasattr(conf.llm, k) and not v and k == 'api_key':
            pass  # Keep existing key if blank (user didn't type a new one)

    # Inject the correct LiteLLM env variable per provider
    if conf.llm.api_key:
        provider = conf.llm.provider.lower()
        if provider == "openai":
            os.environ["OPENAI_API_KEY"] = conf.llm.api_key
        elif provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = conf.llm.api_key
        elif provider == "groq":
            os.environ["GROQ_API_KEY"] = conf.llm.api_key
        elif provider == "cohere":
            os.environ["COHERE_API_KEY"] = conf.llm.api_key
        # LiteLLM also picks up a generic key for other providers
        os.environ["LITELLM_API_KEY"] = conf.llm.api_key

    if conf.llm.base_url:
        os.environ["OLLAMA_BASE_URL"] = conf.llm.base_url

    save_config(conf)
    return conf

def is_configured() -> dict:
    conf = load_config()
    return {
        "jira_configured": bool(conf.jira.jira_url and conf.jira.api_token and conf.jira.email),
        "llm_configured": bool(conf.llm.api_key or conf.llm.provider == "ollama")
    }

# Preload env vars from saved config at server startup
_startup_conf = load_config()
if _startup_conf.llm.api_key:
    key = _startup_conf.llm.api_key
    provider = _startup_conf.llm.provider.lower()
    
    # Provider-specific keys for common libraries
    if provider == "openai":
        os.environ["OPENAI_API_KEY"] = key
    elif provider == "anthropic":
        os.environ["ANTHROPIC_API_KEY"] = key
    elif provider == "groq":
        os.environ["GROQ_API_KEY"] = key
    elif provider == "cohere":
        os.environ["COHERE_API_KEY"] = key
    
    # Universal fallback for LiteLLM/Instructor
    os.environ["LITELLM_API_KEY"] = key
    
if _startup_conf.llm.base_url:
    os.environ["OLLAMA_BASE_URL"] = _startup_conf.llm.base_url
