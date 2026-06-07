"""
Simple MCP Inspector Alternative (Web UI)
==========================================
This is a lightweight Flask-based web UI to test your MCP server
without needing the official MCP Inspector (which has issues on some Windows setups).

Install dependency:
    pip install flask

Run:
    python inspector_alt.py

Then open http://localhost:8080 in your browser.
"""

import json
import subprocess
import sys
import threading
import time
from pathlib import Path

from flask import Flask, jsonify, render_template_string, request

app = Flask(__name__)

SERVER_PATH = Path(__file__).parent / "mcp_server.py"
PYTHON = sys.executable

# Simple in-memory test runner
results_cache = {}


HTML_PAGE = """
<!DOCTYPE html>
<html>
<head>
    <title>VWO MCP Inspector (Alternative)</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 900px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; margin-bottom: 5px; }
        .subtitle { color: #666; margin-bottom: 25px; font-size: 14px; }
        .tool-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 10px; margin-bottom: 25px; }
        .tool-btn { padding: 12px 16px; border: 1px solid #ddd; border-radius: 8px; background: #fafafa; cursor: pointer; text-align: left; transition: all 0.2s; }
        .tool-btn:hover { background: #e3f2fd; border-color: #2196F3; }
        .tool-btn.active { background: #2196F3; color: white; border-color: #2196F3; }
        .params { margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
        .param-row { display: flex; align-items: center; margin-bottom: 10px; }
        .param-row label { width: 120px; font-weight: 600; font-size: 13px; }
        .param-row input, .param-row select { flex: 1; padding: 8px; border: 1px solid #ddd; border-radius: 6px; }
        button.execute { background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px; }
        button.execute:hover { background: #45a049; }
        .output { margin-top: 20px; padding: 15px; background: #263238; color: #aed581; border-radius: 8px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; max-height: 500px; overflow: auto; white-space: pre-wrap; }
        .status { padding: 10px 15px; border-radius: 6px; margin-bottom: 15px; font-weight: 600; }
        .status.ok { background: #e8f5e9; color: #2e7d32; }
        .status.error { background: #ffebee; color: #c62828; }
        .prompt-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #eee; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 VWO MCP Inspector (Alternative)</h1>
        <div class="subtitle">Lightweight Web UI for testing your MCP server without the official Inspector</div>

        {% if server_status == 'ok' %}
        <div class="status ok">✅ Server is running | 18 Tools | 8 Prompts | 478 Test Cases</div>
        {% else %}
        <div class="status error">❌ Server check failed: {{ server_status }}</div>
        {% endif %}

        <h3>Select a Tool to Test:</h3>
        <div class="tool-grid">
            <div class="tool-btn" onclick="selectTool('get_testcase')">get_testcase</div>
            <div class="tool-btn" onclick="selectTool('list_testcases')">list_testcases</div>
            <div class="tool-btn" onclick="selectTool('search_testcases')">search_testcases</div>
            <div class="tool-btn" onclick="selectTool('get_metadata')">get_metadata</div>
            <div class="tool-btn" onclick="selectTool('get_testcase_count')">get_testcase_count</div>
            <div class="tool-btn" onclick="selectTool('get_distribution')">get_distribution</div>
            <div class="tool-btn" onclick="selectTool('get_testcases_by_sprint')">get_testcases_by_sprint</div>
            <div class="tool-btn" onclick="selectTool('get_testcases_by_label')">get_testcases_by_label</div>
            <div class="tool-btn" onclick="selectTool('get_testcases_by_jira')">get_testcases_by_jira</div>
            <div class="tool-btn" onclick="selectTool('compare_testcases')">compare_testcases</div>
            <div class="tool-btn" onclick="selectTool('find_missing_metadata')">find_missing_metadata</div>
            <div class="tool-btn" onclick="selectTool('get_recent_testcases')">get_recent_testcases</div>
            <div class="tool-btn" onclick="selectTool('export_testcases')">export_testcases</div>
            <div class="tool-btn" onclick="selectTool('add_testcase')">add_testcase</div>
            <div class="tool-btn" onclick="selectTool('update_testcase')">update_testcase</div>
            <div class="tool-btn" onclick="selectTool('delete_testcase')">delete_testcase</div>
            <div class="tool-btn" onclick="selectTool('get_statistics')">get_statistics</div>
            <div class="tool-btn" onclick="selectTool('find_duplicate_summaries')">find_duplicate_summaries</div>
        </div>

        <div id="paramsSection" class="params" style="display:none;">
            <div id="paramInputs"></div>
            <button class="execute" onclick="executeTool()">▶ Execute Tool</button>
        </div>

        <div id="output" class="output" style="display:none;"></div>

        <div class="prompt-section">
            <h3>📋 Available Prompts:</h3>
            <ul>
                <li>summarize_module(module)</li>
                <li>summarize_priority(priority)</li>
                <li>analyze_coverage()</li>
                <li>generate_test_plan(sprint)</li>
                <li>audit_test_quality()</li>
                <li>summarize_owner_workload(owner)</li>
                <li>compare_sprints(sprint1, sprint2)</li>
                <li>find_regression_sanity_smoke()</li>
            </ul>
        </div>
    </div>

    <script>
        const toolParams = {
            'get_testcase': [{name:'id', label:'Test Case ID', value:'TC-00001', type:'text'}],
            'list_testcases': [
                {name:'priority', label:'Priority', value:'', type:'select', options:['','P0','P1','P2','P3']},
                {name:'module', label:'Module', value:'', type:'text'},
                {name:'status', label:'Status', value:'', type:'select', options:['','Active','Draft','Archived']},
                {name:'owner', label:'Owner', value:'', type:'text'},
                {name:'label', label:'Label', value:'', type:'text'},
                {name:'limit', label:'Limit', value:'10', type:'number'}
            ],
            'search_testcases': [
                {name:'query', label:'Search Query', value:'cookie', type:'text'},
                {name:'limit', label:'Limit', value:'10', type:'number'}
            ],
            'get_metadata': [
                {name:'field', label:'Field', value:'module', type:'select', options:['priority','module','status','severity','owner','test_type','labels','sprint']}
            ],
            'get_testcase_count': [
                {name:'priority', label:'Priority', value:'P0', type:'select', options:['','P0','P1','P2','P3']},
                {name:'module', label:'Module', value:'', type:'text'}
            ],
            'get_distribution': [
                {name:'field', label:'Field', value:'module', type:'select', options:['priority','module','status','severity','owner','test_type']}
            ],
            'get_testcases_by_sprint': [{name:'sprint', label:'Sprint', value:'VWO-25.S38', type:'text'}],
            'get_testcases_by_label': [{name:'label', label:'Label', value:'regression', type:'text'}],
            'get_testcases_by_jira': [{name:'jira_id', label:'JIRA ID', value:'VWO-2989', type:'text'}],
            'compare_testcases': [
                {name:'id1', label:'First ID', value:'TC-00001', type:'text'},
                {name:'id2', label:'Second ID', value:'TC-00002', type:'text'}
            ],
            'find_missing_metadata': [],
            'get_recent_testcases': [{name:'n', label:'Count', value:'5', type:'number'}],
            'export_testcases': [
                {name:'format', label:'Format', value:'json', type:'select', options:['json','csv']},
                {name:'priority', label:'Priority Filter', value:'', type:'select', options:['','P0','P1','P2','P3']}
            ],
            'add_testcase': [
                {name:'summary', label:'Summary', value:'Verify new feature works', type:'text'},
                {name:'module', label:'Module', value:'API', type:'text'},
                {name:'priority', label:'Priority', value:'P2', type:'select', options:['P0','P1','P2','P3']},
                {name:'severity', label:'Severity', value:'Major', type:'text'},
                {name:'steps', label:'Steps', value:'1. Do step one || 2. Do step two', type:'text'},
                {name:'expected_result', label:'Expected Result', value:'Feature works correctly', type:'text'},
                {name:'test_type', label:'Test Type', value:'Functional', type:'text'},
                {name:'owner', label:'Owner', value:'test.user', type:'text'}
            ],
            'update_testcase': [
                {name:'id', label:'Test Case ID', value:'TC-00001', type:'text'},
                {name:'status', label:'New Status', value:'Active', type:'select', options:['','Active','Draft','Archived']}
            ],
            'delete_testcase': [{name:'id', label:'Test Case ID', value:'TC-00999', type:'text'}],
            'get_statistics': [],
            'find_duplicate_summaries': [{name:'threshold', label:'Threshold (0-1)', value:'0.85', type:'text'}]
        };

        let currentTool = '';

        function selectTool(tool) {
            currentTool = tool;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');

            const container = document.getElementById('paramInputs');
            const params = toolParams[tool] || [];
            let html = '<h4>' + tool + '</h4>';
            params.forEach(p => {
                html += '<div class="param-row">';
                html += '<label>' + p.label + ':</label>';
                if (p.type === 'select') {
                    html += '<select id="param_' + p.name + '">';
                    p.options.forEach(o => html += '<option value="' + o + '">' + (o || '(any)') + '</option>');
                    html += '</select>';
                } else {
                    html += '<input type="' + p.type + '" id="param_' + p.name + '" value="' + p.value + '">';
                }
                html += '</div>';
            });
            container.innerHTML = html;
            document.getElementById('paramsSection').style.display = 'block';
            document.getElementById('output').style.display = 'none';
        }

        async function executeTool() {
            const params = {};
            const inputs = document.querySelectorAll('#paramInputs input, #paramInputs select');
            inputs.forEach(inp => {
                const name = inp.id.replace('param_', '');
                let val = inp.value;
                if (inp.type === 'number') val = parseInt(val) || 0;
                if (val !== '') params[name] = val;
            });

            document.getElementById('output').style.display = 'block';
            document.getElementById('output').textContent = 'Loading...';

            try {
                const resp = await fetch('/api/tool/' + currentTool, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(params)
                });
                const data = await resp.json();
                document.getElementById('output').textContent = JSON.stringify(data, null, 2);
            } catch (e) {
                document.getElementById('output').textContent = 'Error: ' + e.message;
            }
        }
    </script>
</body>
</html>
"""


# ---------------------------------------------------------------------------
# Import the server modules directly for testing
# ---------------------------------------------------------------------------

def check_server():
    try:
        import mcp_server as srv
        return "ok", len(srv.store.records)
    except Exception as e:
        return str(e), 0


@app.route("/")
def index():
    status, count = check_server()
    return render_template_string(HTML_PAGE, server_status=status)


@app.route("/api/tool/<tool_name>", methods=["POST"])
def call_tool(tool_name):
    try:
        import mcp_server as srv
        params = request.get_json() or {}

        # Map tool names to functions
        tool_map = {
            "get_testcase": srv.get_testcase,
            "list_testcases": srv.list_testcases,
            "search_testcases": srv.search_testcases,
            "get_metadata": srv.get_metadata,
            "get_testcase_count": srv.get_testcase_count,
            "get_distribution": srv.get_distribution,
            "get_testcases_by_sprint": srv.get_testcases_by_sprint,
            "get_testcases_by_label": srv.get_testcases_by_label,
            "get_testcases_by_jira": srv.get_testcases_by_jira,
            "compare_testcases": srv.compare_testcases,
            "find_missing_metadata": srv.find_missing_metadata,
            "get_recent_testcases": srv.get_recent_testcases,
            "export_testcases": srv.export_testcases,
            "add_testcase": srv.add_testcase,
            "update_testcase": srv.update_testcase,
            "delete_testcase": srv.delete_testcase,
            "get_statistics": srv.get_statistics,
            "find_duplicate_summaries": srv.find_duplicate_summaries,
        }

        if tool_name not in tool_map:
            return jsonify({"error": f"Unknown tool: {tool_name}"}), 404

        result = tool_map[tool_name](**params)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("=" * 60)
    print("VWO MCP Alternative Inspector")
    print("=" * 60)
    print("\nOpen your browser and go to: http://localhost:8080")
    print("Press Ctrl+C to stop.\n")
    app.run(host="0.0.0.0", port=8080, debug=False)
