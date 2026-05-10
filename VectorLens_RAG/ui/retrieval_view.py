import streamlit as st
from typing import Optional
from core.pipeline import QueryTrace
from ui.styles import stage_header, score_pill
import plotly.graph_objects as go


def _emb_bar_chart(values: list, title: str):
    fig = go.Figure(go.Bar(
        x=list(range(len(values))),
        y=values,
        marker=dict(color=values, colorscale="Purples", showscale=False),
    ))
    fig.update_layout(
        paper_bgcolor="#111111", plot_bgcolor="#1C1C1E",
        font=dict(color="#9CA3AF", size=10),
        xaxis=dict(title="Dim", showgrid=False),
        yaxis=dict(title="Value", showgrid=True, gridcolor="#2C2C2E"),
        margin=dict(l=30, r=10, t=10, b=30),
        height=180,
    )
    st.plotly_chart(fig, use_container_width=True)


def render_retrieval_view(trace: Optional[QueryTrace]):
    if trace is None:
        st.markdown("""
        <div style="text-align:center; padding: 80px 40px; color: #4B5563;">
            <div style="font-size:48px; margin-bottom:16px;">🔍</div>
            <div style="font-size:18px; font-weight:600; color:#6B7280;">Awaiting your query</div>
            <div style="font-size:13px; margin-top:8px;">
                Type a question in the sidebar and click <b>Run Query</b>.
            </div>
        </div>
        """, unsafe_allow_html=True)
        return

    st.markdown(stage_header("2", "RAG Pipeline Trace", "🔬"), unsafe_allow_html=True)

    # ── Summary bar ──────────────────────────────────────────────────────────
    m1, m2, m3, m4 = st.columns(4)
    m1.markdown(
        f'<div class="metric-tile"><div class="value">{len(trace.retrieved_chunks)}</div>'
        f'<div class="label">Chunks Retrieved</div></div>', unsafe_allow_html=True)
    m2.markdown(
        f'<div class="metric-tile"><div class="value">{trace.context_chunks_used}</div>'
        f'<div class="label">Chunks Used</div></div>', unsafe_allow_html=True)
    rerank_label = "✓ Yes" if trace.reranking_applied else "✗ No"
    m3.markdown(
        f'<div class="metric-tile"><div class="value" style="font-size:20px;">{rerank_label}</div>'
        f'<div class="label">Reranking</div></div>', unsafe_allow_html=True)
    m4.markdown(
        f'<div class="metric-tile"><div class="value" style="font-size:20px;">{trace.total_latency_ms:.0f}ms</div>'
        f'<div class="label">Total Latency</div></div>', unsafe_allow_html=True)

    st.markdown("<hr class='section-divider'>", unsafe_allow_html=True)

    # ── Stage 1: Query Understanding ─────────────────────────────────────────
    with st.expander("🧠  Stage 1 — Query Understanding", expanded=True):
        st.markdown(
            f'<div class="rag-card">'
            f'<div style="color:#9CA3AF;font-size:11px;text-transform:uppercase;">Parsed Query</div>'
            f'<div style="color:#E2E8F0;font-size:15px;font-weight:500;margin-top:8px;">"{trace.query}"</div>'
            f'</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<div style="color:#9CA3AF;font-size:12px;margin-bottom:6px;">'
            f'Query Embedding Preview — first 8 of <b>{trace.query_embedding_dim}</b> dimensions</div>',
            unsafe_allow_html=True,
        )
        _emb_bar_chart(trace.query_embedding_preview, "Query Embedding (first 8 dims)")
        st.caption(f"Values: {[round(v, 4) for v in trace.query_embedding_preview]}")

    # ── Stage 2: Chunk Retrieval ──────────────────────────────────────────────
    with st.expander(f"📦  Stage 2 — Chunk Retrieval  (top-{trace.top_k})", expanded=True):
        st.markdown(
            f'<div style="color:#9CA3AF;font-size:12px;margin-bottom:10px;">'
            f'Retrieved <b>{len(trace.retrieved_chunks)}</b> chunks · '
            f'Retrieval latency: <span class="latency-badge">{trace.retrieval_latency_ms} ms</span></div>',
            unsafe_allow_html=True,
        )
        for i, ch in enumerate(trace.retrieved_chunks):
            pill = score_pill(ch.similarity_score)
            with st.expander(
                f"Chunk #{i+1} — similarity {ch.similarity_score:.4f}  |  row {ch.metadata.get('source_row','?')}",
                expanded=(i == 0),
            ):
                st.markdown(
                    f'<div class="chunk-card">{ch.text}</div>',
                    unsafe_allow_html=True,
                )
                meta_cols = st.columns(3)
                meta_cols[0].caption(f"**ID:** `{ch.chunk_id[:20]}…`")
                meta_cols[1].caption(f"**Similarity:** {ch.similarity_score:.4f}")
                meta_cols[2].caption(f"**Distance:** {ch.distance:.4f}")
                with st.expander("📋 Metadata", expanded=False):
                    st.json(ch.metadata)

    # ── Stage 3: Re-ranking ───────────────────────────────────────────────────
    with st.expander("🎯  Stage 3 — Re-ranking", expanded=True):
        if not trace.reranking_applied:
            st.info("Re-ranking was disabled for this query.")
        else:
            model_info = trace.reranker_info
            st.markdown(
                f'<div style="color:#9CA3AF;font-size:12px;margin-bottom:10px;">'
                f'Model: <b>{model_info.get("model","—")}</b> ({model_info.get("type","—")}) · '
                f'{len(trace.reranked_chunks)} chunks re-scored</div>',
                unsafe_allow_html=True,
            )

            # Before/After comparison table
            if trace.reranked_chunks:
                rows = []
                for ch in trace.reranked_chunks:
                    delta = ch.rank_delta
                    delta_str = f"▲ {delta}" if delta > 0 else (f"▼ {abs(delta)}" if delta < 0 else "—")
                    rows.append({
                        "Final Rank": ch.final_rank + 1,
                        "Original Rank": ch.original_rank + 1,
                        "Δ Rank": delta_str,
                        "Similarity Score": round(ch.original_score, 4),
                        "Rerank Score": round(ch.rerank_score, 4),
                        "Chunk Preview": ch.text[:80] + "…",
                    })

                import pandas as pd
                df = pd.DataFrame(rows)
                st.dataframe(df, use_container_width=True, hide_index=True)

                st.markdown("#### Final Re-ranked Chunks")
                for i, ch in enumerate(trace.reranked_chunks):
                    delta = ch.rank_delta
                    delta_html = (
                        f'<span class="chunk-delta-up">▲{delta}</span>' if delta > 0
                        else (f'<span class="chunk-delta-down">▼{abs(delta)}</span>' if delta < 0
                              else '<span style="color:#6B7280">—</span>')
                    )
                    st.markdown(
                        f'<div class="chunk-card chunk-card-reranked">'
                        f'<div style="font-size:11px;color:#6B7280;margin-bottom:6px;">'
                        f'Rank #{i+1} {delta_html} &nbsp;·&nbsp; '
                        f'Rerank: <b>{ch.rerank_score:.4f}</b> &nbsp;·&nbsp; '
                        f'Similarity: {ch.original_score:.4f}'
                        f'</div>'
                        f'<div style="white-space:pre-wrap;">{ch.text}</div>'
                        f'</div>',
                        unsafe_allow_html=True,
                    )

    # ── Stage 4: Context Construction ─────────────────────────────────────────
    with st.expander("📝  Stage 4 — Context Construction", expanded=False):
        st.markdown(
            f'<div style="color:#9CA3AF;font-size:12px;margin-bottom:8px;">'
            f'<b>{trace.context_chunks_used}</b> chunks merged into final prompt '
            f'({len(trace.context_prompt)} chars)</div>',
            unsafe_allow_html=True,
        )
        st.markdown(
            f'<div class="prompt-block">{trace.context_prompt}</div>',
            unsafe_allow_html=True,
        )

    # ── Stage 5: LLM Response ─────────────────────────────────────────────────
    with st.expander("✨  Stage 5 — LLM Response Generation", expanded=True):
        if trace.llm_response:
            resp = trace.llm_response
            r1, r2, r3 = st.columns(3)
            r1.markdown(
                f'<div class="rag-card" style="text-align:center;">'
                f'<div style="color:#9CA3AF;font-size:11px;">Model</div>'
                f'<div style="color:#C084FC;font-size:13px;font-weight:600;margin-top:4px;">{resp.model}</div>'
                f'</div>', unsafe_allow_html=True)
            r2.markdown(
                f'<div class="rag-card" style="text-align:center;">'
                f'<div style="color:#9CA3AF;font-size:11px;">Latency</div>'
                f'<div class="latency-badge" style="margin-top:8px;display:inline-block;">{resp.latency_ms:.0f} ms</div>'
                f'</div>', unsafe_allow_html=True)
            r3.markdown(
                f'<div class="rag-card" style="text-align:center;">'
                f'<div style="color:#9CA3AF;font-size:11px;">Ralphloop</div>'
                f'<div class="ralphloop-badge" style="margin-top:8px;">{resp.attempts} attempt(s)</div>'
                f'</div>', unsafe_allow_html=True)

            st.markdown("<br>", unsafe_allow_html=True)
            with st.container():
                st.markdown(resp.text)
        else:
            st.warning("No LLM response available.")
