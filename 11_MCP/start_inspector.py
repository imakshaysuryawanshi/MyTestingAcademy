import subprocess
import time
import sys

def main():
    print("Starting Uvicorn Server on port 5001 (Streamable HTTP)...")
    # Start the server in the background
    server_process = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5001"]
    )
    
    # Wait a couple of seconds for the server to fully boot up
    time.sleep(2)
    
    print("\nStarting MCP Inspector...")
    print("Once it opens, go to http://localhost:5173, select SSE, and use URL: http://localhost:5001/sse")
    print("Press Ctrl+C to close everything.\n")
    
    try:
        # Start the inspector in the foreground
        subprocess.run("npx @modelcontextprotocol/inspector", shell=True)
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received...")
    finally:
        print("Shutting down Uvicorn server...")
        server_process.terminate()
        server_process.wait()
        print("All processes stopped successfully!")

if __name__ == "__main__":
    main()
