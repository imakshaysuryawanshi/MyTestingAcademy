import streamlit as st
import pandas as pd
from typing import Optional
from core.ingestion import IngestionResult
from core.embeddings import get_model_info
from core.vector_store import get_all_chunks, get_collection_stats
from ui.styles import stage_header, card, score_pill


def render_ingestion_view(result: Optional[IngestionResult], collection_name: Optional[str]):
    if result is None:
        st.markdown("""
        <div style="text-align:center; padding: 80px 40px; color: #4B5563;">
            <div style="font-size:48px; margin-bottom:16px;">📂</div>
            <div style="font-size:18px; font-weight:600; color:#6B7280;">No data ingested yet</div>
            <div style="font-size:13px; margin-top:8px;">Upload a CSV or Excel file from the sidebar to begin.</div>
        </div>
        """, unsafe_allow_html=True)
        return

    # ── Top metrics ──────────────────────────────────────────────────────────
    st.markdown(stage_header("1", "Data Ingestion & Indexing", "📥"), unsafe_allow_html=True)

    c1, c2, c3, c4 = st.columns(4)
    for col, val, lbl in [
        (c1, result.total_rows, "Total Rows"),
        (c2, result.total_chunks, "Total Chunks"),
        (c3, result.chunk_size, "Chunk Size"),
        (c4, result.overlap_size, "Overlap"),
    ]:
        col.markdown(
            f'<div class="metric-tile"><div class="value">{val}</div>'
            f'<div class="label">{lbl}</div></div>',
            unsafe_allow_html=True,
        )

    st.markdown("<hr class='section-divider'>", unsafe_allow_html=True)

    # ── Tabs ──────────────────────────────────────────────────────────────────
    tab1, tab2, tab3, tab4 = st.tabs([
        "🗃️ Raw Data Preview",
        "✂️ Chunking Visualization",
        "🧬 Embeddings",
        "🗄️ Vector Store Browser",
    ])

    # ── Tab 1: Raw Data ───────────────────────────────────────────────────────
    with tab1:
        st.markdown("#### Uploaded Data Preview")
        st.caption(f"{result.total_rows} rows · {len(result.columns_used)} columns")
        page_size = 50
        total_pages = max(1, (result.total_rows - 1) // page_size + 1)
        page = st.number_input("Page", min_value=1, max_value=total_pages, value=1, step=1, key="raw_page")
        start = (page - 1) * page_size
        st.dataframe(
            result.raw_df.iloc[start: start + page_size],
            use_container_width=True,
            height=400,
        )

    # ── Tab 2: Chunking Visualization ─────────────────────────────────────────
    with tab2:
        st.markdown("#### Chunking Strategy")
        info_col1, info_col2, info_col3 = st.columns(3)
        info_col1.info(f"**Strategy:** {result.strategy}")
        info_col2.info(f"**Chunk Size:** {result.chunk_size} chars")
        info_col3.info(f"**Overlap:** {result.overlap_size} chars")

        st.markdown("---")
        st.markdown("#### Per-Row Chunk Breakdown")
        st.caption("Select a row to see how it was split into chunks.")

        # Group chunks by source row
        row_to_chunks = {}
        for ch in result.chunks:
            row_to_chunks.setdefault(ch.source_row, []).append(ch)

        row_ids = sorted(row_to_chunks.keys())
        max_preview = min(100, len(row_ids))
        selected_row = st.selectbox(
            "Source Row Index",
            options=row_ids[:max_preview],
            format_func=lambda x: f"Row {x} → {row_to_chunks[x][0].total_chunks_in_row} chunk(s)",
            key="chunk_row_select",
        )

        if selected_row is not None:
            chunks_for_row = row_to_chunks[selected_row]
            st.markdown(
                f"<div style='color:#9CA3AF;font-size:12px;margin-bottom:10px;'>"
                f"Row <b>{selected_row}</b> split into <b>{len(chunks_for_row)}</b> chunk(s)</div>",
                unsafe_allow_html=True,
            )
            colors = ["#7C3AED", "#C084FC", "#A855F7", "#9333EA", "#6D28D9"]
            for i, ch in enumerate(chunks_for_row):
                border_color = colors[i % len(colors)]
                st.markdown(
                    f"""<div class="chunk-card" style="border-left-color:{border_color}">
                        <div style="font-size:11px;color:#6B7280;margin-bottom:6px;">
                            Chunk {i+1}/{len(chunks_for_row)} &nbsp;·&nbsp;
                            {len(ch.text)} chars &nbsp;·&nbsp; ID: <code>{ch.chunk_id[:12]}…</code>
                        </div>
                        <div style="white-space:pre-wrap;">{ch.text}</div>
                    </div>""",
                    unsafe_allow_html=True,
                )

    # ── Tab 3: Embeddings ─────────────────────────────────────────────────────
    with tab3:
        info = get_model_info()
        st.markdown("#### Embedding Model")
        mc1, mc2 = st.columns(2)
        mc1.markdown(
            f'<div class="rag-card">'
            f'<div style="color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Model</div>'
            f'<div style="color:#C084FC;font-size:14px;font-weight:600;margin-top:6px;">{info["model_name"]}</div>'
            f'<div style="color:#6B7280;font-size:12px;margin-top:4px;">{info["source"]}</div>'
            f'</div>',
            unsafe_allow_html=True,
        )
        mc2.markdown(
            f'<div class="rag-card">'
            f'<div style="color:#9CA3AF;font-size:11px;text-transform:uppercase;letter-spacing:.5px;">Dimensions</div>'
            f'<div style="color:#C084FC;font-size:28px;font-weight:700;margin-top:6px;">{info["embedding_dim"]}</div>'
            f'<div style="color:#6B7280;font-size:12px;margin-top:4px;">L2-normalized cosine space</div>'
            f'</div>',
            unsafe_allow_html=True,
        )

        st.markdown("---")
        st.markdown("#### Sample Embedding Preview (first chunk)")
        if result.chunks:
            first_chunk = result.chunks[0]
            st.caption(f"Chunk: `{first_chunk.text[:80]}…`")
            if "embedding_preview" in st.session_state:
                emb = st.session_state["embedding_preview"]
                import plotly.graph_objects as go
                fig = go.Figure(go.Bar(
                    x=list(range(len(emb))),
                    y=emb,
                    marker=dict(
                        color=emb,
                        colorscale="Purples",
                        showscale=False,
                    ),
                ))
                fig.update_layout(
                    paper_bgcolor="#111111",
                    plot_bgcolor="#1C1C1E",
                    font=dict(color="#9CA3AF", size=11),
                    xaxis=dict(title="Dimension Index", showgrid=False),
                    yaxis=dict(title="Value", showgrid=True, gridcolor="#2C2C2E"),
                    margin=dict(l=40, r=20, t=20, b=40),
                    height=280,
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Embeddings are generated during ingestion. Run ingestion to see a preview.")
        else:
            st.warning("No chunks available.")

    # ── Tab 4: Vector Store Browser ───────────────────────────────────────────
    with tab4:
        if collection_name:
            stats = get_collection_stats(collection_name)
            if stats:
                sc1, sc2, sc3 = st.columns(3)
                sc1.markdown(
                    f'<div class="metric-tile"><div class="value">{stats["total_chunks"]}</div>'
                    f'<div class="label">Chunks Stored</div></div>',
                    unsafe_allow_html=True,
                )
                sc2.markdown(
                    f'<div class="metric-tile"><div class="value">{stats["embedding_dim"]}</div>'
                    f'<div class="label">Embedding Dim</div></div>',
                    unsafe_allow_html=True,
                )
                sc3.markdown(
                    f'<div class="metric-tile"><div class="value" style="font-size:14px;">HNSW</div>'
                    f'<div class="label">Index Method</div></div>',
                    unsafe_allow_html=True,
                )

                st.markdown("---")
                st.markdown(f"**Collection:** `{collection_name}` &nbsp;·&nbsp; **DB Path:** `{stats['db_path']}`")

                # Paginated browser
                page_size = 20
                total = stats["total_chunks"]
                total_pages = max(1, (total - 1) // page_size + 1)
                vs_page = st.number_input("Page", min_value=1, max_value=total_pages, value=1, key="vs_page")
                offset = (vs_page - 1) * page_size
                data = get_all_chunks(collection_name, limit=page_size, offset=offset)

                for i, (cid, doc, meta) in enumerate(
                    zip(data["ids"], data["documents"], data["metadatas"])
                ):
                    with st.expander(f"Chunk {offset+i+1} · `{cid[:16]}…`", expanded=False):
                        st.markdown(
                            f'<div class="chunk-card">{doc}</div>',
                            unsafe_allow_html=True,
                        )
                        st.json(meta, expanded=False)
            else:
                st.warning("Collection not found in ChromaDB.")
        else:
            st.info("Ingest a file to populate the vector store.")
