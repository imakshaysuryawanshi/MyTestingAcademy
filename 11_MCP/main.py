from server.mcp_server import mcp

# Expose the ASGI app for uvicorn
app = mcp.http_app() if callable(getattr(mcp, "http_app", None)) else getattr(mcp, "sse_app", None)
