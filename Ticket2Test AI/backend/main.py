from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import jira, testcases, settings

app = FastAPI(title="Ticket2Test AI")

# Allow CORS for everything in dev
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(jira.router, prefix="/api/jira")
app.include_router(testcases.router, prefix="/api/testcases")
app.include_router(settings.router, prefix="/api/settings")

@app.get("/")
def read_root():
    return {"status": "ok", "message": "AI Test Case Generator API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
