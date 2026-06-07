"""
Quick validation script for mcp_server.py tools.
Run: python validate_tools.py
"""

import sys
sys.path.insert(0, r"W:\The Testing Academy\GenAI10X\MyTestingAcademy\12_MCP_Creation")

import mcp_server as srv

print("=" * 60)
print("VWO MCP SERVER VALIDATION")
print("=" * 60)

# 1. Basic load
print(f"\n[1] Loaded {len(srv.store.records)} records")
print(f"     Headers: {srv.store.headers}")
print(f"     Next ID: {srv.store.get_next_id()}")

# 2. get_testcase
print("\n[2] get_testcase('TC-00001')")
result = srv.get_testcase("TC-00001")
print(f"     Found: {result['found']}")
if result['found']:
    print(f"     Summary: {result['testcase']['summary'][:60]}...")

# 3. list_testcases
print("\n[3] list_testcases(priority='P0', limit=3)")
result = srv.list_testcases(priority="P0", limit=3)
print(f"     Total P0: {result['total']}, Returned: {len(result['results'])}")
for r in result['results']:
    print(f"       {r['id']} | {r['summary'][:50]}...")

# 4. search_testcases
print("\n[4] search_testcases('cookie')")
result = srv.search_testcases("cookie", limit=3)
print(f"     Total matches: {result['total']}")
for r in result['results']:
    print(f"       {r['id']} | {r['summary'][:50]}...")

# 5. get_metadata
print("\n[5] get_metadata('priority')")
result = srv.get_metadata("priority")
print(f"     Priorities: {result}")

# 6. get_distribution
print("\n[6] get_distribution('module')")
result = srv.get_distribution("module")
for k, v in sorted(result.items(), key=lambda x: -x[1])[:5]:
    print(f"     {k}: {v}")

# 7. get_statistics
print("\n[7] get_statistics()")
result = srv.get_statistics()
print(f"     Total: {result['total_testcases']}")
print(f"     By Status: {result['by_status']}")
print(f"     By Priority: {result['by_priority']}")

# 8. find_missing_metadata
print("\n[8] find_missing_metadata()")
result = srv.find_missing_metadata()
print(f"     Cases with missing critical fields: {len(result)}")

# 9. get_testcases_by_label
print("\n[9] get_testcases_by_label('regression')")
result = srv.get_testcases_by_label("regression")
print(f"     Regression tests: {len(result)}")

# 10. compare_testcases
print("\n[10] compare_testcases('TC-00001', 'TC-00002')")
result = srv.compare_testcases("TC-00001", "TC-00002")
print(f"     Differences found: {len(result.get('differences', []))}")

# 11. find_duplicate_summaries
print("\n[11] find_duplicate_summaries(threshold=0.85)")
result = srv.find_duplicate_summaries(threshold=0.85)
print(f"     Potential duplicates: {len(result)}")
if result:
    print(f"     Top pair: {result[0]['testcase_1']} vs {result[0]['testcase_2']} (sim={result[0]['similarity']})")

# 12. add_testcase
print("\n[12] add_testcase()")
new_id = srv.store.get_next_id()
result = srv.add_testcase(
    summary="Verify new checkout flow works end-to-end",
    module="Checkout",
    priority="P1",
    severity="Major",
    steps="1. Add item to cart || 2. Proceed to checkout || 3. Complete payment",
    expected_result="Order placed successfully | Confirmation email sent",
    test_type="Functional",
    owner="test.user",
    labels="regression|smoke",
    preconditions="User logged in | Cart has items",
    sprint="VWO-25.S99",
    status="Draft",
)
print(f"     Added: {result['success']} | New ID: {result['id']}")
added_id = result['id']

# Verify persistence by reloading
print("\n[12b] Verifying persistence after add...")
srv.store._load()
rec = srv.store.find_by_id(added_id)
print(f"     Found after reload: {rec is not None}")
if rec:
    print(f"     Labels parsed: {rec['_labels']}")

# 13. update_testcase
print("\n[13] update_testcase(id, status='Active')")
result = srv.update_testcase(added_id, status="Active")
print(f"     Updated: {result['success']} | Changed: {result['changed_fields']}")

# Verify persistence after update
srv.store._load()
rec = srv.store.find_by_id(added_id)
print(f"     Status after reload: {rec['status']}")

# 14. delete_testcase
print("\n[14] delete_testcase(id)")
result = srv.delete_testcase(added_id)
print(f"     Deleted: {result['success']}")

# Verify persistence after delete
srv.store._load()
rec = srv.store.find_by_id(added_id)
print(f"     Found after delete: {rec is not None}")

# 15. export_testcases
print("\n[15] export_testcases(format='json', priority='P0')")
result = srv.export_testcases(format="json", priority="P0")
print(f"     JSON length: {len(result)} chars")

print("\n" + "=" * 60)
print("VALIDATION COMPLETE")
print("=" * 60)
