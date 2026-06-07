"""
VWO Test Case MCP Server
=========================
A comprehensive FastMCP server that exposes 18 tools and 8 prompts
for managing and analyzing VWO test cases from testcases_vwo_100.csv.

Transport: stdio (default)
Usage:   python mcp_server.py
"""

import csv
import json
import re
from collections import Counter
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from fastmcp import FastMCP

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
CSV_PATH = Path(__file__).parent / "testcases_vwo_100.csv"

# ---------------------------------------------------------------------------
# Data Store
# ---------------------------------------------------------------------------

class TestCaseStore:
    def __init__(self, csv_path: Path):
        self.csv_path = csv_path
        self.headers: List[str] = []
        self.records: List[Dict[str, Any]] = []
        self._load()

    def _load(self):
        with open(self.csv_path, "r", encoding="utf-8", newline="") as f:
            reader = csv.DictReader(f)
            self.headers = reader.fieldnames or []
            self.records = []
            for row in reader:
                # Normalise empty strings to None for optional fields
                for key in row:
                    if row[key] == "":
                        row[key] = None
                # Split labels into a list for easy filtering
                raw_labels = row.get("labels") or ""
                row["_labels"] = [l.strip() for l in raw_labels.split("|") if l.strip()]
                # Extract numeric portion of ID for sorting / next-id generation
                m = re.search(r"\d+", row.get("id", ""))
                row["_id_num"] = int(m.group()) if m else 0
                self.records.append(row)

    def _to_csv_row(self, row: Dict[str, Any]) -> Dict[str, str]:
        """Convert an internal record back to a CSV-safe dict."""
        out = {}
        for h in self.headers:
            if h == "labels":
                out[h] = "|".join(row.get("_labels", []))
            else:
                val = row.get(h)
                out[h] = val if val is not None else ""
        return out

    def _save(self):
        with open(self.csv_path, "w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=self.headers)
            writer.writeheader()
            for row in self.records:
                writer.writerow(self._to_csv_row(row))
        self._load()

    def get_next_id(self) -> str:
        max_num = max((r["_id_num"] for r in self.records), default=0)
        return f"TC-{max_num + 1:05d}"

    def find_by_id(self, id: str) -> Optional[Dict[str, Any]]:
        for r in self.records:
            if r.get("id") == id:
                return r
        return None

    def delete_by_id(self, id: str) -> bool:
        original_len = len(self.records)
        self.records = [r for r in self.records if r.get("id") != id]
        if len(self.records) < original_len:
            self._save()
            return True
        return False


store = TestCaseStore(CSV_PATH)
mcp = FastMCP("vwo_testcases")

# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def _clean_record(row: Dict[str, Any]) -> Dict[str, Any]:
    """Return a copy without internal underscore-prefixed keys."""
    return {k: v for k, v in row.items() if not k.startswith("_")}


def _filter_records(
    priority: Optional[str] = None,
    module: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    test_type: Optional[str] = None,
    severity: Optional[str] = None,
    label: Optional[str] = None,
    sprint: Optional[str] = None,
) -> List[Dict[str, Any]]:
    results = store.records
    if priority:
        results = [r for r in results if r.get("priority") == priority]
    if module:
        results = [r for r in results if r.get("module") == module]
    if status:
        results = [r for r in results if r.get("status") == status]
    if owner:
        results = [r for r in results if r.get("owner") == owner]
    if test_type:
        results = [r for r in results if r.get("test_type") == test_type]
    if severity:
        results = [r for r in results if r.get("severity") == severity]
    if label:
        results = [r for r in results if label in r.get("_labels", [])]
    if sprint:
        results = [r for r in results if r.get("sprint") == sprint]
    return results


def _paginate(records: List[Dict[str, Any]], limit: int, offset: int):
    total = len(records)
    sliced = records[offset : offset + limit]
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total,
        "results": [_clean_record(r) for r in sliced],
    }


# ---------------------------------------------------------------------------
# TOOLS (18 total)
# ---------------------------------------------------------------------------

@mcp.tool()
def get_testcase(id: str) -> Dict[str, Any]:
    """
    Fetch a single test case by exact ID (e.g. TC-00001).
    """
    rec = store.find_by_id(id)
    if rec:
        return {"found": True, "testcase": _clean_record(rec)}
    return {"found": False, "message": f"Test case {id} not found."}


@mcp.tool()
def list_testcases(
    priority: Optional[Literal["P0", "P1", "P2", "P3"]] = None,
    module: Optional[str] = None,
    status: Optional[Literal["Active", "Draft", "Archived"]] = None,
    owner: Optional[str] = None,
    test_type: Optional[str] = None,
    severity: Optional[str] = None,
    label: Optional[str] = None,
    sprint: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    List test cases with optional filters and pagination.
    Supports filtering by priority, module, status, owner, test_type, severity, label, and sprint.
    """
    results = _filter_records(priority, module, status, owner, test_type, severity, label, sprint)
    return _paginate(results, limit, offset)


@mcp.tool()
def search_testcases(
    query: str,
    fields: Optional[List[str]] = None,
    limit: int = 20,
    offset: int = 0,
) -> Dict[str, Any]:
    """
    Full-text search across test case text fields.
    Searches in: summary, steps, expected_result, preconditions.
    Optional 'fields' restricts which columns to search.
    """
    query_lower = query.lower()
    search_fields = fields or ["summary", "steps", "expected_result", "preconditions"]
    matches = []
    for r in store.records:
        for field in search_fields:
            val = r.get(field) or ""
            if query_lower in str(val).lower():
                matches.append(r)
                break
    return _paginate(matches, limit, offset)


@mcp.tool()
def get_metadata(
    field: Literal[
        "priority",
        "module",
        "status",
        "severity",
        "owner",
        "test_type",
        "labels",
        "sprint",
    ]
) -> List[str]:
    """
    Return all unique values for a given field.
    Useful for discovering available filters before querying.
    """
    if field == "labels":
        vals = set()
        for r in store.records:
            vals.update(r.get("_labels", []))
        return sorted(vals)
    vals = {r.get(field) for r in store.records if r.get(field)}
    return sorted(vals)


@mcp.tool()
def get_testcase_count(
    priority: Optional[str] = None,
    module: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    label: Optional[str] = None,
) -> int:
    """
    Count how many test cases match the provided filters.
    """
    results = _filter_records(priority, module, status, owner, label=label)
    return len(results)


@mcp.tool()
def get_distribution(
    field: Literal["priority", "module", "status", "severity", "owner", "test_type"]
) -> Dict[str, int]:
    """
    Return a breakdown (value -> count) for the chosen field.
    """
    counts = Counter(r.get(field) for r in store.records if r.get(field))
    return dict(counts)


@mcp.tool()
def get_testcases_by_sprint(sprint: str) -> List[Dict[str, Any]]:
    """
    Retrieve every test case belonging to a specific sprint.
    """
    return [_clean_record(r) for r in store.records if r.get("sprint") == sprint]


@mcp.tool()
def get_testcases_by_label(label: str) -> List[Dict[str, Any]]:
    """
    Retrieve every test case that carries a specific label.
    """
    return [_clean_record(r) for r in store.records if label in r.get("_labels", [])]


@mcp.tool()
def get_testcases_by_jira(jira_id: str) -> List[Dict[str, Any]]:
    """
    Find test cases linked to a specific JIRA ticket ID.
    """
    return [_clean_record(r) for r in store.records if r.get("jira_id") == jira_id]


@mcp.tool()
def compare_testcases(id1: str, id2: str) -> Dict[str, Any]:
    """
    Side-by-side comparison of two test cases.
    Returns both records and highlights differing fields.
    """
    r1 = store.find_by_id(id1)
    r2 = store.find_by_id(id2)
    if not r1:
        return {"error": f"Test case {id1} not found."}
    if not r2:
        return {"error": f"Test case {id2} not found."}

    differences = []
    for h in store.headers:
        if h in ("id",):
            continue
        v1 = r1.get(h)
        v2 = r2.get(h)
        if v1 != v2:
            differences.append({"field": h, "left": v1, "right": v2})

    return {
        "testcase_1": _clean_record(r1),
        "testcase_2": _clean_record(r2),
        "differences": differences,
    }


@mcp.tool()
def find_missing_metadata() -> List[Dict[str, Any]]:
    """
    Find test cases that have empty critical fields:
    steps, expected_result, preconditions, or owner.
    """
    critical = ["steps", "expected_result", "preconditions", "owner"]
    bad = []
    for r in store.records:
        missing = [f for f in critical if not r.get(f)]
        if missing:
            rec = _clean_record(r)
            rec["missing_fields"] = missing
            bad.append(rec)
    return bad


@mcp.tool()
def get_recent_testcases(n: int = 10) -> List[Dict[str, Any]]:
    """
    Return the most recent n test cases ordered by ID descending.
    """
    sorted_records = sorted(store.records, key=lambda r: r["_id_num"], reverse=True)
    return [_clean_record(r) for r in sorted_records[:n]]


@mcp.tool()
def export_testcases(
    format: Literal["json", "csv"] = "json",
    priority: Optional[str] = None,
    module: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
) -> str:
    """
    Export matching test cases as a JSON or CSV string.
    """
    results = _filter_records(priority, module, status, owner)
    cleaned = [_clean_record(r) for r in results]
    if format == "json":
        return json.dumps(cleaned, indent=2)
    # CSV
    lines = []
    if cleaned:
        fieldnames = list(cleaned[0].keys())
        lines.append(",".join(fieldnames))
        for row in cleaned:
            line = ",".join(
                f'"{str(row.get(k, "")).replace(chr(34), chr(34)+chr(34))}"' for k in fieldnames
            )
            lines.append(line)
    return "\n".join(lines)


@mcp.tool()
def add_testcase(
    summary: str,
    module: str,
    priority: Literal["P0", "P1", "P2", "P3"],
    severity: str,
    steps: str,
    expected_result: str,
    test_type: str,
    owner: str,
    jira_id: Optional[str] = "",
    labels: Optional[str] = "",
    preconditions: Optional[str] = "",
    sprint: Optional[str] = "",
    status: Optional[Literal["Active", "Draft", "Archived"]] = "Draft",
) -> Dict[str, Any]:
    """
    Add a new test case to the repository.
    The ID is auto-generated (next sequential TC-XXXXX).
    The record is immediately persisted to the CSV file.
    """
    new_id = store.get_next_id()
    new_row = {
        "id": new_id,
        "jira_id": jira_id or None,
        "summary": summary,
        "module": module,
        "priority": priority,
        "severity": severity,
        "labels": labels or None,
        "preconditions": preconditions or None,
        "steps": steps,
        "expected_result": expected_result,
        "test_type": test_type,
        "owner": owner,
        "sprint": sprint or None,
        "status": status,
        "_labels": [l.strip() for l in (labels or "").split("|") if l.strip()],
        "_id_num": int(re.search(r"\d+", new_id).group()),
    }
    store.records.append(new_row)
    store._save()
    return {"success": True, "id": new_id, "testcase": _clean_record(new_row)}


@mcp.tool()
def update_testcase(
    id: str,
    jira_id: Optional[str] = None,
    summary: Optional[str] = None,
    module: Optional[str] = None,
    priority: Optional[str] = None,
    severity: Optional[str] = None,
    labels: Optional[str] = None,
    preconditions: Optional[str] = None,
    steps: Optional[str] = None,
    expected_result: Optional[str] = None,
    test_type: Optional[str] = None,
    owner: Optional[str] = None,
    sprint: Optional[str] = None,
    status: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Update one or more fields of an existing test case.
    Only provided fields are changed; others remain untouched.
    Changes are persisted to the CSV immediately.
    """
    rec = store.find_by_id(id)
    if not rec:
        return {"success": False, "message": f"Test case {id} not found."}

    updates = {
        "jira_id": jira_id,
        "summary": summary,
        "module": module,
        "priority": priority,
        "severity": severity,
        "labels": labels,
        "preconditions": preconditions,
        "steps": steps,
        "expected_result": expected_result,
        "test_type": test_type,
        "owner": owner,
        "sprint": sprint,
        "status": status,
    }
    changed = []
    for key, val in updates.items():
        if val is not None:
            rec[key] = val
            changed.append(key)

    if "labels" in changed:
        rec["_labels"] = [l.strip() for l in (rec.get("labels") or "").split("|") if l.strip()]

    store._save()
    return {"success": True, "id": id, "changed_fields": changed, "testcase": _clean_record(rec)}


@mcp.tool()
def delete_testcase(id: str) -> Dict[str, Any]:
    """
    Delete a test case by ID. The change is persisted to the CSV immediately.
    """
    ok = store.delete_by_id(id)
    if ok:
        return {"success": True, "message": f"Test case {id} deleted."}
    return {"success": False, "message": f"Test case {id} not found."}


@mcp.tool()
def get_statistics() -> Dict[str, Any]:
    """
    Overall repository statistics:
    total count, status split, top modules, top owners, severity split, priority split.
    """
    total = len(store.records)
    status_counts = Counter(r.get("status") for r in store.records if r.get("status"))
    module_counts = Counter(r.get("module") for r in store.records if r.get("module"))
    owner_counts = Counter(r.get("owner") for r in store.records if r.get("owner"))
    severity_counts = Counter(r.get("severity") for r in store.records if r.get("severity"))
    priority_counts = Counter(r.get("priority") for r in store.records if r.get("priority"))

    return {
        "total_testcases": total,
        "by_status": dict(status_counts),
        "by_module": dict(module_counts.most_common(10)),
        "by_owner": dict(owner_counts.most_common(10)),
        "by_severity": dict(severity_counts),
        "by_priority": dict(priority_counts),
    }


@mcp.tool()
def find_duplicate_summaries(threshold: float = 0.8) -> List[Dict[str, Any]]:
    """
    Find potentially duplicate test cases based on summary text similarity.
    Uses SequenceMatcher ratio; pairs above the threshold are returned.
    """
    dupes = []
    records = store.records
    for i in range(len(records)):
        for j in range(i + 1, len(records)):
            s1 = records[i].get("summary", "")
            s2 = records[j].get("summary", "")
            if not s1 or not s2:
                continue
            ratio = SequenceMatcher(None, s1.lower(), s2.lower()).ratio()
            if ratio >= threshold:
                dupes.append(
                    {
                        "similarity": round(ratio, 3),
                        "testcase_1": records[i].get("id"),
                        "summary_1": s1,
                        "testcase_2": records[j].get("id"),
                        "summary_2": s2,
                    }
                )
    # Sort by highest similarity first
    dupes.sort(key=lambda x: x["similarity"], reverse=True)
    return dupes[:50]  # cap at 50 to avoid huge payloads


# ---------------------------------------------------------------------------
# PROMPTS (8 total)
# ---------------------------------------------------------------------------

@mcp.prompt()
def summarize_module(module: str) -> str:
    """
    Prompt that asks the LLM to summarize all test cases for a given module.
    """
    return (
        f"Please use the available tools to fetch every test case where module='{module}'. "
        f"Then produce a structured summary including:\n"
        f"1. Total count of test cases in this module.\n"
        f"2. Breakdown by priority (P0/P1/P2/P3).\n"
        f"3. Breakdown by status (Active/Draft/Archived).\n"
        f"4. List of owners working on this module.\n"
        f"5. A concise narrative of what this module's test coverage looks like.\n"
        f"6. Any gaps or risks you notice (e.g. too many Drafts, no P0s, missing preconditions)."
    )


@mcp.prompt()
def summarize_priority(priority: str) -> str:
    """
    Prompt that asks the LLM to summarize test cases by priority.
    """
    return (
        f"Please fetch all test cases with priority='{priority}' using the available tools. "
        f"Then provide:\n"
        f"1. Total count and percentage of total repository.\n"
        f"2. Distribution by module and severity.\n"
        f"3. Owners responsible for these high/critical items.\n"
        f"4. Any patterns (e.g. are P0s concentrated in Auth or API?).\n"
        f"5. Recommendations for triage or execution order."
    )


@mcp.prompt()
def analyze_coverage() -> str:
    """
    Prompt for a comprehensive coverage-gap analysis.
    """
    return (
        "Run a comprehensive coverage analysis on the entire test case repository.\n"
        "Use the tools to gather statistics, metadata, and identify missing metadata.\n"
        "Produce a report with:\n"
        "1. Module coverage heat-map (which modules have most/least tests).\n"
        "2. Priority balance (is the pyramid healthy or inverted?).\n"
        "3. Status health (how many Draft vs Active vs Archived?).\n"
        "4. Metadata quality score (empty steps, missing preconditions, missing owners).\n"
        "5. Top 5 risks or gaps you would flag to a QA lead.\n"
        "6. Actionable recommendations to improve coverage and quality."
    )


@mcp.prompt()
def generate_test_plan(sprint: str) -> str:
    """
    Prompt to generate a test execution plan for a sprint.
    """
    return (
        f"Fetch all test cases belonging to sprint='{sprint}'.\n"
        f"Then generate a structured test execution plan containing:\n"
        f"1. Sprint summary (total cases, modules involved, priority mix).\n"
        f"2. Execution sequence (P0 first, then P1, then P2/P3).\n"
        f"3. Owner assignment summary.\n"
        f"4. Any dependencies or preconditions that must be set up first.\n"
        f"5. Risk items (Blocker severity, missing metadata).\n"
        f"6. Estimated effort categories (smoke, regression, exploratory)."
    )


@mcp.prompt()
def audit_test_quality() -> str:
    """
    Prompt for a quality audit of the test case repository.
    """
    return (
        "Perform a full quality audit of the test case repository.\n"
        "Use the tools to find missing metadata, get statistics, and inspect duplicates.\n"
        "Deliver an audit report with:\n"
        "1. Overall health score (0-100) based on completeness.\n"
        "2. List of test cases with missing steps, expected results, preconditions, or owners.\n"
        "3. Duplicate or near-duplicate test cases that should be merged.\n"
        "4. Inconsistent naming or module classification.\n"
        "5. Severity vs Priority mismatch warnings.\n"
        "6. A prioritized backlog of cleanup tasks."
    )


@mcp.prompt()
def summarize_owner_workload(owner: str) -> str:
    """
    Prompt to summarize one owner's workload.
    """
    return (
        f"Fetch all test cases owned by '{owner}' and produce a workload summary:\n"
        f"1. Total test cases assigned.\n"
        f"2. Breakdown by module, priority, and severity.\n"
        f"3. Active vs Draft vs Archived split.\n"
        f"4. Sprint distribution (which sprints they are contributing to).\n"
        f"5. Label analysis (are they focused on regression, smoke, accessibility?).\n"
        f"6. Any red flags (too many Blockers, too many Drafts, missing metadata)."
    )


@mcp.prompt()
def compare_sprints(sprint1: str, sprint2: str) -> str:
    """
    Prompt to compare two sprints side-by-side.
    """
    return (
        f"Fetch test cases for sprint '{sprint1}' and sprint '{sprint2}'.\n"
        f"Then produce a comparative report with:\n"
        f"1. Volume comparison (count, module spread).\n"
        f"2. Priority shift (more P0s in one sprint?).\n"
        f"3. Owner overlap (same people or different?).\n"
        f"4. Risk profile (Blocker/Critical count per sprint).\n"
        f"5. Quality trend (metadata completeness, Draft ratio).\n"
        f"6. Recommendations for resource balancing."
    )


@mcp.prompt()
def find_regression_sanity_smoke() -> str:
    """
    Prompt to extract and summarize all regression, sanity, and smoke tests.
    """
    return (
        "Use the tools to find all test cases that contain the labels 'regression', "
        "'sanity', or 'smoke'. Then produce:\n"
        "1. A combined summary of regression, sanity, and smoke coverage.\n"
        "2. Breakdown by module and priority for each category.\n"
        "3. Identification of modules that lack smoke or sanity coverage.\n"
        "4. Suggestions for a nightly CI pipeline based on the test mix.\n"
        "5. Any high-priority gaps in the regression suite."
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mcp.run(transport="stdio")
