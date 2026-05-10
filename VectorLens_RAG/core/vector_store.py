import chromadb
from dataclasses import dataclass
from typing import List, Dict, Any, Optional

DB_PATH = "./chroma_db"


@dataclass
class ScoredChunk:
    chunk_id: str
    text: str
    metadata: Dict[str, Any]
    similarity_score: float
    distance: float


def _client() -> chromadb.PersistentClient:
    return chromadb.PersistentClient(path=DB_PATH)


def create_collection(name: str) -> chromadb.Collection:
    client = _client()
    try:
        client.delete_collection(name)
    except Exception:
        pass
    return client.create_collection(name=name, metadata={"hnsw:space": "cosine"})


def get_collection(name: str) -> Optional[chromadb.Collection]:
    try:
        return _client().get_collection(name)
    except Exception:
        return None


def list_collections() -> List[str]:
    return [c.name for c in _client().list_collections()]


def upsert_chunks(
    collection_name: str,
    chunk_ids: List[str],
    texts: List[str],
    embeddings: List[List[float]],
    metadatas: List[Dict[str, Any]],
) -> int:
    col = get_collection(collection_name) or create_collection(collection_name)
    batch = 500
    for i in range(0, len(chunk_ids), batch):
        col.upsert(
            ids=chunk_ids[i:i + batch],
            embeddings=embeddings[i:i + batch],
            documents=texts[i:i + batch],
            metadatas=metadatas[i:i + batch],
        )
    return col.count()


def similarity_search(
    collection_name: str,
    query_embedding: List[float],
    top_k: int = 10,
) -> List[ScoredChunk]:
    col = get_collection(collection_name)
    if col is None or col.count() == 0:
        return []
    results = col.query(
        query_embeddings=[query_embedding],
        n_results=min(top_k, col.count()),
        include=["documents", "metadatas", "distances"],
    )
    out = []
    for i in range(len(results["ids"][0])):
        dist = results["distances"][0][i]
        out.append(ScoredChunk(
            chunk_id=results["ids"][0][i],
            text=results["documents"][0][i],
            metadata=results["metadatas"][0][i],
            similarity_score=round(1.0 - dist, 4),
            distance=round(dist, 4),
        ))
    return out


def get_all_chunks(collection_name: str, limit: int = 100, offset: int = 0) -> Dict[str, Any]:
    col = get_collection(collection_name)
    if col is None:
        return {"ids": [], "documents": [], "metadatas": [], "total": 0}
    total = col.count()
    data = col.get(limit=limit, offset=offset, include=["documents", "metadatas"])
    data["total"] = total
    return data


def get_collection_stats(collection_name: str) -> Dict[str, Any]:
    col = get_collection(collection_name)
    if col is None:
        return {}
    return {
        "name": collection_name,
        "total_chunks": col.count(),
        "indexing_method": "HNSW (cosine similarity)",
        "embedding_dim": 768,
        "db_path": DB_PATH,
    }
