from fastmcp import FastMCP
import json

def register_resources(mcp: FastMCP):
    @mcp.resource("config://city")
    def city_config() -> str:
        """Get the city configuration"""
        return json.dumps({"theme": "dark", "language": "en"})

    @mcp.resource("data://city/test")
    def city_test_data() -> str:
        """Get the city test data"""
        return json.dumps({"cities": ["New York", "London", "Tokyo"]})

    @mcp.resource("state://browser/city")
    def city_browser_state() -> str:
        """Get the current browser state for city navigation"""
        return json.dumps({"current_url": "https://example.com/city", "status": "active"})
