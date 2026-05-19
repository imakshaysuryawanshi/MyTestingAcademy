from fastmcp import FastMCP

def register_prompts(mcp: FastMCP):
    @mcp.prompt()
    def generate_test_plan(project_name: str) -> str:
        """Generate a test plan for the given project"""
        return f"Please generate a comprehensive E2E test plan for {project_name}."

    @mcp.prompt()
    def playwright_debug_prompt(error_message: str) -> str:
        """Help debug a Playwright error"""
        return f"I encountered the following Playwright error: {error_message}. How can I fix it?"

    @mcp.prompt()
    def city_navigation_prompt() -> str:
        """Prompt for navigating city data"""
        return "What is the best way to navigate and test city-related data tables?"

    @mcp.prompt()
    def browser_error_analysis(logs: str) -> str:
        """Analyze browser console errors"""
        return f"Analyze these browser console errors and suggest fixes: {logs}"

    @mcp.prompt()
    def automation_strategy_prompt() -> str:
        """Discuss automation strategy"""
        return "What is the best automation strategy for a highly dynamic single-page application?"
