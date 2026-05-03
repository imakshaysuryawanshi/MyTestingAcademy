import pandas as pd
import uuid
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
from langchain_text_splitters import RecursiveCharacterTextSplitter


@dataclass
class Chunk:
    chunk_id: str
    text: str
    source_row: int
    chunk_index: int
    total_chunks_in_row: int
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class IngestionResult:
    raw_df: pd.DataFrame
    chunks: List[Chunk]
    chunk_size: int
    overlap_size: int
    strategy: str
    total_rows: int
    total_chunks: int
    columns_used: List[str]


def row_to_text(row: pd.Series, columns: List[str]) -> str:
    parts = []
    for col in columns:
        val = row.get(col, "")
        if str(val).strip():
            parts.append(f"{col}: {str(val).strip()}")
    return "\n".join(parts)


def ingest_file(
    file_obj,
    filename: str,
    chunk_size: int = 512,
    overlap: int = 64,
    text_columns: Optional[List[str]] = None,
) -> IngestionResult:
    if filename.endswith(".csv"):
        df = pd.read_csv(file_obj)
    elif filename.endswith((".xlsx", ".xls")):
        df = pd.read_excel(file_obj)
    else:
        raise ValueError(f"Unsupported file type: {filename}")

    df = df.fillna("").astype(str)
    cols = text_columns or list(df.columns)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=overlap,
        length_function=len,
    )

    all_chunks: List[Chunk] = []
    for row_idx, row in df.iterrows():
        row_text = row_to_text(row, cols)
        if not row_text.strip():
            continue

        splits = splitter.split_text(row_text)
        if not splits:
            splits = [row_text]

        for chunk_idx, text in enumerate(splits):
            meta = {
                "source_row": int(row_idx),
                "chunk_index": chunk_idx,
                "total_chunks_in_row": len(splits),
            }
            for c in cols[:6]:
                meta[c] = str(row.get(c, ""))

            all_chunks.append(Chunk(
                chunk_id=str(uuid.uuid4()),
                text=text,
                source_row=int(row_idx),
                chunk_index=chunk_idx,
                total_chunks_in_row=len(splits),
                metadata=meta,
            ))

    return IngestionResult(
        raw_df=df,
        chunks=all_chunks,
        chunk_size=chunk_size,
        overlap_size=overlap,
        strategy="RecursiveCharacterTextSplitter",
        total_rows=len(df),
        total_chunks=len(all_chunks),
        columns_used=cols,
    )
