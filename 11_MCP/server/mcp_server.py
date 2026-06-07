from fastmcp import FastMCP
from tools.playwright_tools import register_tools
from resources.resources import register_resources
from prompts.prompts import register_prompts

mcp = FastMCP("TheTestingAcademy")

register_tools(mcp)
register_resources(mcp)
register_prompts(mcp)
