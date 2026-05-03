from dataclasses import dataclass
from typing import List, Optional
from sentence_transformers import CrossEncoder

_reranker: Optional[CrossEncoder] = None
RERANKER_MODEL = "BAAI/bge-reranker-base"


@dataclass
class RankedChunk:
    chunk_id: str
    text: str
    metadata: dict
    original_score: float
    rerank_score: float
    original_rank: int
    final_rank: int
    rank_delta: int  # positive = moved up in rank


def get_reranker() -> CrossEncoder:
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(RERANKER_MODEL)
    return _reranker


def rerank(query: str, chunks: list) -> List[RankedChunk]:
    """Re-rank retrieved chunks using BGE cross-encoder."""
    if not chunks:
        return []
    reranker = get_reranker()
    pairs = [[query, c.text] for c in chunks]
    scores = reranker.predict(pairs)

    indexed = list(enumerate(zip(chunks, scores)))
    reranked = sorted(indexed, key=lambda x: x[1][1], reverse=True)

    result = []
    for final_rank, (original_rank, (chunk, score)) in enumerate(reranked):
        result.append(RankedChunk(
            chunk_id=chunk.chunk_id,
            text=chunk.text,
            metadata=chunk.metadata,
            original_score=chunk.similarity_score,
            rerank_score=float(score),
            original_rank=original_rank,
            final_rank=final_rank,
            rank_delta=original_rank - final_rank,
        ))
    return result


def get_reranker_info() -> dict:
    return {
        "model": RERANKER_MODEL,
        "type": "Cross-Encoder",
        "source": "HuggingFace (local inference)",
    }
