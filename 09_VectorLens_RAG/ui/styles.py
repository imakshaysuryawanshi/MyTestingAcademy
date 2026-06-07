import streamlit as st

STYLES = """
<style>
/* ── Global reset ── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* ── Main background ── */
.stApp {
    background: radial-gradient(circle at 10% 20%, #0a0a0e 0%, #020205 100%);
    background-attachment: fixed;
}

/* ── Sidebar ── */
[data-testid="stSidebar"] {
    background: rgba(15, 15, 20, 0.6) !important;
    backdrop-filter: blur(20px);
    border-right: 1px solid rgba(255, 255, 255, 0.05);
}
[data-testid="stSidebar"] .stMarkdown h1,
[data-testid="stSidebar"] .stMarkdown h2,
[data-testid="stSidebar"] .stMarkdown h3 {
    color: #d8b4fe;
    text-shadow: 0 0 15px rgba(192, 132, 252, 0.4);
}

/* ── Cards ── */
.rag-card {
    background: rgba(30, 30, 35, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 20px 24px;
    margin-bottom: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.rag-card:hover {
    border-color: rgba(192, 132, 252, 0.5);
    box-shadow: 0 8px 32px rgba(192, 132, 252, 0.15);
    transform: translateY(-2px);
}

/* ── Stage headers ── */
.stage-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}
.stage-badge {
    background: linear-gradient(135deg, #8b5cf6, #d946ef);
    color: white;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 24px;
    letter-spacing: 1px;
    text-transform: uppercase;
    box-shadow: 0 0 10px rgba(217, 70, 239, 0.4);
}
.stage-title {
    color: #f8fafc;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.5px;
}

/* ── Score pill ── */
.score-pill {
    display: inline-block;
    background: #22C55E22;
    border: 1px solid #22C55E44;
    color: #4ADE80;
    font-size: 11px;
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 20px;
    margin-left: 8px;
}
.score-pill-low {
    background: #EF444422;
    border: 1px solid #EF444444;
    color: #F87171;
}
.score-pill-mid {
    background: #F59E0B22;
    border: 1px solid #F59E0B44;
    color: #FCD34D;
}

/* ── Chunk card ── */
.chunk-card {
    background: rgba(30, 30, 35, 0.4);
    border-left: 3px solid #8b5cf6;
    border-radius: 8px;
    padding: 14px 18px;
    margin: 10px 0;
    font-size: 13px;
    color: #cbd5e1;
    line-height: 1.6;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.chunk-card-reranked {
    border-left-color: #d946ef;
    background: rgba(217, 70, 239, 0.03);
}
.chunk-delta-up {
    color: #4ade80;
    font-weight: 700;
}
.chunk-delta-down {
    color: #f87171;
    font-weight: 700;
}

/* ── Latency badge ── */
.latency-badge {
    background: rgba(30, 58, 138, 0.3);
    color: #93c5fd;
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid rgba(59, 130, 246, 0.3);
}

/* ── Embedding bar ── */
.emb-bar-container {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 6px 0;
}
.emb-label {
    color: #94a3b8;
    font-size: 10px;
    width: 24px;
    text-align: right;
    font-weight: 600;
}
.emb-bar {
    height: 12px;
    border-radius: 4px;
    transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.1);
}

/* ── Prompt block ── */
.prompt-block {
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(51, 65, 85, 0.5);
    border-radius: 10px;
    padding: 16px 20px;
    font-family: 'JetBrains Mono', 'Courier New', monospace;
    font-size: 12px;
    color: #94a3b8;
    white-space: pre-wrap;
    max-height: 350px;
    overflow-y: auto;
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}

/* ── Response block ── */
.response-block {
    background: rgba(8, 47, 73, 0.4);
    border: 1px solid rgba(14, 165, 233, 0.3);
    border-radius: 12px;
    padding: 24px 28px;
    color: #f1f5f9;
    font-size: 15px;
    line-height: 1.8;
    white-space: pre-wrap;
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.1);
}

/* ── Metric tiles ── */
.metric-tile {
    background: rgba(30, 30, 35, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s;
}
.metric-tile:hover {
    transform: translateY(-2px);
    border-color: rgba(192, 132, 252, 0.3);
}
.metric-tile .value {
    font-size: 36px;
    font-weight: 800;
    background: linear-gradient(135deg, #c084fc, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    line-height: 1.2;
    text-shadow: 0 0 20px rgba(192, 132, 252, 0.2);
}
.metric-tile .label {
    font-size: 12px;
    font-weight: 600;
    color: #94a3b8;
    margin-top: 8px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

/* ── Section divider ── */
.section-divider {
    border: none;
    border-top: 1px solid #2C2C2E;
    margin: 20px 0;
}

/* ── Ralphloop badge ── */
.ralphloop-badge {
    background: #7C3AED22;
    border: 1px solid #7C3AED55;
    color: #C084FC;
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 20px;
    display: inline-block;
}

/* ── Tab styling ── */
.stTabs [data-baseweb="tab-list"] {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    padding: 6px;
    gap: 8px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.5);
}
.stTabs [data-baseweb="tab"] {
    border-radius: 6px;
    color: #94a3b8;
    font-size: 13px;
    font-weight: 600;
    padding: 8px 16px;
    border: none !important;
    transition: all 0.3s ease;
}
.stTabs [data-baseweb="tab"]:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #e2e8f0;
}
.stTabs [aria-selected="true"] {
    background: linear-gradient(135deg, #8b5cf6, #d946ef) !important;
    color: white !important;
    box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4);
}
.stTabs [data-baseweb="tab-highlight"] {
    display: none !important;
}
.stTabs [data-baseweb="tab-border"] {
    display: none !important;
}

/* ── Scrollbar ── */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-track { background: #1A1A1A; }
::-webkit-scrollbar-thumb { background: #3F3F46; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #7C3AED; }
</style>
"""


def inject_styles():
    st.markdown(STYLES, unsafe_allow_html=True)


def card(content_html: str, extra_class: str = "") -> str:
    return f'<div class="rag-card {extra_class}">{content_html}</div>'


def stage_header(number: str, label: str, icon: str = "") -> str:
    return (
        f'<div class="stage-header">'
        f'<span class="stage-badge">{icon} Stage {number}</span>'
        f'<span class="stage-title">{label}</span>'
        f'</div>'
    )


def score_pill(score: float) -> str:
    cls = "score-pill" if score >= 0.7 else ("score-pill-mid" if score >= 0.4 else "score-pill-low")
    return f'<span class="{cls}">{score:.4f}</span>'
