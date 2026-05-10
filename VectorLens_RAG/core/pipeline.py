import time
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any

from core.embeddings import embed_single, get_model_info
from core.vector_store import similarity_search, ScoredChunk
from core.reranker import rerank, RankedChunk, get_reranker_info
from core.llm import generate, LLMResponse, DEFAULT_MODEL

SYSTEM_PROMPT = """You are an expert QA engineer and test analyst assistant.
You have access to a rich database of historical test cases. Your goal is twofold:
1. If the user asks a question about existing data, answer clearly using the context.
2. If the user asks to CREATE or GENERATE a new test case, synthesize a brand NEW test case. Use the retrieved context purely as a reference for formatting, tone, style, and domain logic.
Always be specific, structured, and actionable."""


@dataclass
class QueryTrace:
    query: str
    query_embedding_preview: List[float]   # First 8 dims
    query_embedding_dim: int
    top_k: int
    retrieved_chunks: List[ScoredChunk] = field(default_factory=list)
    retrieval_latency_ms: float = 0.0
    reranking_applied: bool = False
    reranked_chunks: List[RankedChunk] = field(default_factory=list)
    reranker_info: Dict[str, Any] = field(default_factory=dict)
    context_prompt: str = ""
    context_chunks_used: int = 0
    llm_response: Optional[LLMResponse] = None
    total_latency_ms: float = 0.0


def _build_prompt(query: str, chunks: list, use_reranked: bool) -> str:
    if use_reranked:
        parts = [
            f"[Chunk {i+1}] (rerank_score: {c.rerank_score:.4f})\n{c.text}"
            for i, c in enumerate(chunks)
        ]
    else:
        parts = [
            f"[Chunk {i+1}] (similarity: {c.similarity_score:.4f})\n{c.text}"
            for i, c in enumerate(chunks)
        ]
    context = "\n\n---\n\n".join(parts)
    return f"""Based on the following retrieved test case context, fulfill the user's request.

=== RETRIEVED CONTEXT (Reference Data) ===
{context}

=== USER REQUEST ===
{query}

=== INSTRUCTIONS ===
- If the user asks for information, answer strictly based on the context.
- If the user asks you to CREATE or GENERATE a test case, DO NOT just copy an existing one. Generate a NEW test case using the context as a style/formatting guide.
- CRITICAL FORMATTING: When generating a test case, NEVER use a horizontal multi-column table. ALWAYS use a vertical Key-Value Markdown table format.
  - Put the Test Case ID and Title at the top (e.g., **Test Case ID:** TC_123).
  - Create a Markdown table with two columns: `| Field | Details |`.
  - The Fields should be: Summary, Type, Preconditions, Steps, Expected Result, Priority, Module.
"""


def run_query(
    query: str,
    collection_name: str,
    top_k: int = 10,
    apply_reranking: bool = True,
    rerank_top_n: int = 5,
    model: str = DEFAULT_MODEL,
    api_key: Optional[str] = None,
    temperature: float = 0.3,
) -> QueryTrace:
    """Execute full RAG pipeline and return a complete observability trace."""
    t_start = time.time()

    # Stage 1: Query embedding
    query_emb = embed_single(query, is_query=True)

    # Stage 2: Retrieval
    t_ret = time.time()
    retrieved = similarity_search(collection_name, query_emb, top_k=top_k)
    retrieval_ms = round((time.time() - t_ret) * 1000, 1)

    # Stage 3: Reranking
    reranked: List[RankedChunk] = []
    use_reranked = False
    if apply_reranking and retrieved:
        reranked = rerank(query, retrieved)
        final_chunks = reranked[:rerank_top_n]
        use_reranked = True
    else:
        final_chunks = retrieved

    # Stage 4: Context construction
    context_prompt = _build_prompt(query, final_chunks, use_reranked)

    # Stage 5: LLM generation
    llm_resp = generate(
        prompt=context_prompt,
        system_prompt=SYSTEM_PROMPT,
        model=model,
        api_key=api_key,
        temperature=temperature,
    )

    return QueryTrace(
        query=query,
        query_embedding_preview=query_emb[:8],
        query_embedding_dim=len(query_emb),
        top_k=top_k,
        retrieved_chunks=retrieved,
        retrieval_latency_ms=retrieval_ms,
        reranking_applied=use_reranked,
        reranked_chunks=reranked,
        reranker_info=get_reranker_info() if apply_reranking else {},
        context_prompt=context_prompt,
        context_chunks_used=len(final_chunks),
        llm_response=llm_resp,
        total_latency_ms=round((time.time() - t_start) * 1000, 1),
    )
