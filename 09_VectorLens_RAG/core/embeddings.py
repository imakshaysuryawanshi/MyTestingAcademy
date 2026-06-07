from typing import List, Optional
from sentence_transformers import SentenceTransformer

_model: Optional[SentenceTransformer] = None
MODEL_NAME = "BAAI/bge-base-en-v1.5"
EMBEDDING_DIM = 768
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model


def embed_texts(texts: List[str], is_query: bool = False) -> List[List[float]]:
    model = get_model()
    if is_query:
        texts = [QUERY_INSTRUCTION + t for t in texts]
    embeddings = model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
    return embeddings.tolist()


def embed_single(text: str, is_query: bool = False) -> List[float]:
    return embed_texts([text], is_query=is_query)[0]


def get_model_info() -> dict:
    return {
        "model_name": MODEL_NAME,
        "embedding_dim": EMBEDDING_DIM,
        "normalize": True,
        "query_instruction": QUERY_INSTRUCTION,
        "source": "HuggingFace (local inference)",
    }
