import os
import re
import time
import streamlit as st
from dotenv import load_dotenv

load_dotenv()

st.set_page_config(
    page_title="VectorLens",
    page_icon="🔭",
    layout="wide",
    initial_sidebar_state="expanded",
)

from ui.styles import inject_styles
from ui.ingestion_view import render_ingestion_view
from ui.retrieval_view import render_retrieval_view

inject_styles()

# ── Session state defaults ────────────────────────────────────────────────────
def _init_state():
    load_dotenv(override=True)
    defaults = {
        "ingestion_result": None,
        "collection_name": None,
        "query_trace": None,
        "groq_api_key": os.getenv("GROQ_API_KEY", ""),
        "embedding_preview": None,
    }
    for k, v in defaults.items():
        if k not in st.session_state:
            st.session_state[k] = v
    # Always try to refresh key if missing
    if not st.session_state.groq_api_key:
        st.session_state.groq_api_key = os.getenv("GROQ_API_KEY", "")

_init_state()

# ── Sidebar ───────────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown(
        """
        <div style="padding: 4px 0 20px 0;">
            <div style="font-size:22px;font-weight:700;color:#C084FC;letter-spacing:-0.5px;">
                🔭 VectorLens
            </div>
            <div style="font-size:12px;color:#6B7280;margin-top:4px;">
                Advanced RAG · Observability · Debugger
            </div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    # ── API Key status (read from .env, never shown in UI) ────────────────
    if st.session_state.groq_api_key:
        st.markdown(
            '<div style="background:#162013;border:1px solid #22C55E33;border-radius:8px;'
            'padding:8px 14px;font-size:12px;color:#4ADE80;margin-bottom:12px;">'
            '🔐 API key loaded from <code>.env</code></div>',
            unsafe_allow_html=True,
        )
    else:
        st.markdown(
            '<div style="background:#1F1209;border:1px solid #F59E0B44;border-radius:8px;'
            'padding:8px 14px;font-size:12px;color:#FCD34D;margin-bottom:12px;">'
            '⚠️ Add <code>GROQ_API_KEY</code> to <code>.env</code></div>',
            unsafe_allow_html=True,
        )

    st.markdown("---")

    # ── File Upload + Chunking Config ──────────────────────────────────────
    st.markdown("### 📂 Data Ingestion")
    uploaded_file = st.file_uploader(
        "Upload CSV or Excel",
        type=["csv", "xlsx", "xls"],
        accept_multiple_files=False,
        help="Upload test cases (up to 5,000+ rows supported)",
    )

    chunk_size = st.slider("Chunk Size (chars)", 128, 2048, 512, 64, key="chunk_size")
    overlap = st.slider("Overlap (chars)", 0, 512, 64, 16, key="overlap")
    # LLM Model is now configured via .env file

    ingest_btn = st.button("⚡ Ingest & Index", use_container_width=True, type="primary")

    if ingest_btn and uploaded_file is not None:
        with st.spinner("Parsing file…"):
            from core.ingestion import ingest_file
            try:
                result = ingest_file(uploaded_file, uploaded_file.name, chunk_size=chunk_size, overlap=overlap)
                st.session_state.ingestion_result = result
            except Exception as e:
                st.error(f"Ingestion failed: {e}")
                result = None

        if result:
            with st.spinner(f"Embedding {result.total_chunks} chunks with BGE-base…"):
                from core.embeddings import embed_texts
                from core.vector_store import upsert_chunks
                try:
                    texts = [c.text for c in result.chunks]
                    embeddings = embed_texts(texts, is_query=False)

                    # Store first embedding for preview
                    st.session_state.embedding_preview = embeddings[0][:32]

                    # Collection name: sanitized filename + timestamp
                    raw_name = re.sub(r"[^a-zA-Z0-9_-]", "_", uploaded_file.name.rsplit(".", 1)[0])
                    col_name = f"{raw_name}_{int(time.time())}"[-60:]
                    st.session_state.collection_name = col_name

                    total = upsert_chunks(
                        collection_name=col_name,
                        chunk_ids=[c.chunk_id for c in result.chunks],
                        texts=texts,
                        embeddings=embeddings,
                        metadatas=[c.metadata for c in result.chunks],
                    )
                    st.success(f"✅ {total} chunks stored in ChromaDB", icon="🗄️")
                except Exception as e:
                    st.error(f"Embedding/storage failed: {e}")
    elif ingest_btn:
        st.warning("Please upload a file first.")

    st.markdown("---")

    # ── Query Config ───────────────────────────────────────────────────────
    st.markdown("### 🔍 Query")
    top_k = st.slider("Top-K Retrieval", 3, 30, 10, 1, key="top_k")
    apply_reranking = st.toggle("Enable Re-ranking", value=True, key="reranking")
    if apply_reranking:
        rerank_top_n = st.slider("Rerank: Keep Top-N", 1, 15, 5, 1, key="rerank_n")
    else:
        rerank_top_n = top_k
    temperature = st.slider("LLM Temperature", 0.0, 1.0, 0.3, 0.05, key="temperature")

    query_text = st.text_area(
        "Your question",
        placeholder="e.g. Show me login test cases for invalid credentials…",
        height=100,
        key="query_text",
    )
    run_btn = st.button("🚀 Run Query", use_container_width=True, type="primary")

    if run_btn:
        if not st.session_state.collection_name:
            st.error("Ingest a file before running a query.")
        elif not query_text.strip():
            st.warning("Enter a query first.")
        elif not st.session_state.groq_api_key:
            st.error("Groq API key required.")
        else:
            with st.spinner("Running RAG pipeline…"):
                from core.pipeline import run_query
                try:
                    trace = run_query(
                        query=query_text.strip(),
                        collection_name=st.session_state.collection_name,
                        top_k=top_k,
                        apply_reranking=apply_reranking,
                        rerank_top_n=rerank_top_n,
                        api_key=st.session_state.groq_api_key,
                        temperature=temperature,
                    )
                    st.session_state.query_trace = trace
                    st.success(f"✅ Done in {trace.total_latency_ms:.0f} ms", icon="⚡")
                except Exception as e:
                    st.error(f"Pipeline error: {e}")

    st.markdown("---")
    st.markdown(
        '<div style="font-size:11px;color:#4B5563;text-align:center;">'
        'BGE-base · ChromaDB · BGE-Reranker · Groq<br>'
        '<span style="color:#7C3AED;">Ralphloop</span> enabled · Port 4100<br>'
        '<span style="color:#374151;">Key source: <code style="color:#4B5563">.env</code></span>'
        '</div>',
        unsafe_allow_html=True,
    )

# ── Main Panel ────────────────────────────────────────────────────────────────
st.markdown(
    """
    <div style="padding: 8px 0 24px 0; border-bottom: 1px solid #2C2C2E; margin-bottom: 28px;">
        <h1 style="font-size:26px;font-weight:700;color:#ECECEC;margin:0;">
            🔭 VectorLens
        </h1>
        <p style="color:#6B7280;font-size:13px;margin:6px 0 0 0;">
            Full pipeline observability — ingestion · retrieval · reranking · generation
        </p>
    </div>
    """,
    unsafe_allow_html=True,
)

# Two tabs: Ingestion view vs Retrieval view
main_tab1, main_tab2 = st.tabs(["📥 Ingestion & Indexing", "🔍 Query & Pipeline Trace"])

with main_tab1:
    render_ingestion_view(
        result=st.session_state.ingestion_result,
        collection_name=st.session_state.collection_name,
    )

with main_tab2:
    render_retrieval_view(trace=st.session_state.query_trace)
