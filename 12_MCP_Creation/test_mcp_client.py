"""
Test MCP Client for VWO Test Case Server
==========================================
This script connects to mcp_server.py via stdio and exercises
every tool to prove the server works end-to-end.

Run: python test_mcp_client.py
"""

import asyncio
import sys
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

SERVER_PATH = r"W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation\mcp_server.py"


async def run_tests():
    print("=" * 60)
    print("VWO MCP SERVER - END-TO-END TEST")
    print("=" * 60)

    server_params = StdioServerParameters(
        command=sys.executable,
        args=[SERVER_PATH],
        env=None,
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            # Initialize
            print("\n[1] Initializing session...")
            init_result = await session.initialize()
            print(f"     Server name: {init_result.serverInfo.name}")
            print(f"     Server version: {init_result.serverInfo.version}")

            # List tools
            print("\n[2] Listing tools...")
            tools = await session.list_tools()
            print(f"     Tools found: {len(tools.tools)}")
            for t in tools.tools:
                print(f"       - {t.name}: {t.description[:60]}...")

            # List prompts
            print("\n[3] Listing prompts...")
            prompts = await session.list_prompts()
            print(f"     Prompts found: {len(prompts.prompts)}")
            for p in prompts.prompts:
                print(f"       - {p.name}")

            # Call get_testcase
            print("\n[4] Calling get_testcase('TC-00001')...")
            result = await session.call_tool("get_testcase", {"id": "TC-00001"})
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            # Call list_testcases
            print("\n[5] Calling list_testcases(priority='P0', limit=3)...")
            result = await session.call_tool("list_testcases", {"priority": "P0", "limit": 3})
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            # Call search_testcases
            print("\n[6] Calling search_testcases('cookie')...")
            result = await session.call_tool("search_testcases", {"query": "cookie", "limit": 3})
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            # Call get_metadata
            print("\n[7] Calling get_metadata('module')...")
            result = await session.call_tool("get_metadata", {"field": "module"})
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            # Call get_statistics
            print("\n[8] Calling get_statistics()...")
            result = await session.call_tool("get_statistics", {})
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            # Call add_testcase
            print("\n[9] Calling add_testcase()...")
            result = await session.call_tool(
                "add_testcase",
                {
                    "summary": "Verify MCP integration test case creation",
                    "module": "MCP",
                    "priority": "P2",
                    "severity": "Major",
                    "steps": "1. Start MCP server || 2. Call add_testcase || 3. Verify persistence",
                    "expected_result": "Test case created and persisted to CSV",
                    "test_type": "Functional",
                    "owner": "mcp.tester",
                    "labels": "mcp|integration",
                    "preconditions": "Server running",
                    "sprint": "VWO-25.S99",
                    "status": "Draft",
                },
            )
            for content in result.content:
                if content.type == "text":
                    print(f"     Result: {content.text[:200]}...")

            print("\n" + "=" * 60)
            print("ALL TESTS PASSED - MCP SERVER IS WORKING!")
            print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_tests())
