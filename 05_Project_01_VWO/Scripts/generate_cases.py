import pandas as pd
import os

data = [
    # TS_VWO_001 (High, Functional, 3 cases) Pre: User must have a registered account
    ["TC_001_01", "Functional", "Successful Login with valid credentials", "User must have a registered account", "1. Go to app.vwo.com\n2. Enter Username: Sample1234\n3. Enter Password: Sample@1234\n4. Click Login", "Successful login to dashboard", "High"],
    ["TC_001_02", "Functional", "Verify case sensitivity of valid credentials", "User must have a registered account", "1. Enter Username with different case (if case sensitive)\n2. Enter Password (Sample@1234)\n3. Click Login", "Needs clarification (Is username case sensitive?)", "High"],
    ["TC_001_03", "Functional", "Verify Enter key triggers login", "User must have a registered account", "1. Enter Username: Sample1234\n2. Enter Password: Sample@1234\n3. Press Enter key", "Successful login to dashboard", "High"],

    # TS_VWO_002 (High, Functional, 5 cases) Pre: User is on login page
    ["TC_002_01", "Functional", "Invalid Username & Valid Password", "User is on login page", "1. Enter invalid Username\n2. Enter Password: Sample@1234\n3. Click Login", "Login fails. Error msg: Needs clarification", "High"],
    ["TC_002_02", "Functional", "Valid Username & Invalid Password", "User is on login page", "1. Enter Username: Sample1234\n2. Enter invalid Password\n3. Click Login", "Login fails. Error msg: Needs clarification", "High"],
    ["TC_002_03", "Functional", "Invalid Username & Invalid Password", "User is on login page", "1. Enter invalid Username\n2. Enter invalid Password\n3. Click Login", "Login fails. Error msg: Needs clarification", "High"],
    ["TC_002_04", "Functional", "Empty Username & Valid Password", "User is on login page", "1. Leave Username blank\n2. Enter Password: Sample@1234\n3. Click Login", "Login fails. Error msg: Needs clarification", "High"],
    ["TC_002_05", "Functional", "Valid Username & Empty Password", "User is on login page", "1. Enter Username: Sample1234\n2. Leave Password blank\n3. Click Login", "Login fails. Error msg: Needs clarification", "High"],

    # TS_VWO_003 (High, Functional, 4 cases) Pre: User is on login page
    ["TC_003_01", "Functional", "Password masking validation", "User is on login page", "1. Enter characters in Password field", "Characters are masked (e.g., as dots or asterisks)", "High"],
    ["TC_003_02", "Functional", "Password minimum length validation", "User is on login page", "1. Enter password shorter than required length", "Real-time feedback/Error msg: Needs clarification", "High"],
    ["TC_003_03", "Functional", "Password complexity/special character validation", "User is on login page", "1. Enter password without required complexity", "Real-time feedback/Error msg: Needs clarification", "High"],
    ["TC_003_04", "Functional", "Toggle password visibility (if feature exists)", "User is on login page", "1. Enter password\n2. Click 'Show/Hide' icon", "Needs clarification (Does this feature exist?)", "High"],

    # TS_VWO_004 (High, Functional, 3 cases) Pre: User must know their registered email address
    ["TC_004_01", "Functional", "Verify Forgot Password link navigation", "User must know their registered email address", "1. Click 'Forgot Password' link", "Navigates to reset password page", "High"],
    ["TC_004_02", "Functional", "Request password reset with valid email", "User must know their registered email address", "1. Enter registered email\n2. Submit", "Needs clarification (success message, email sent behavior)", "High"],
    ["TC_004_03", "Functional", "Request password reset with invalid/unregistered email", "User must know their registered email address", "1. Enter unregistered email\n2. Submit", "Needs clarification (error message or generic message)", "High"],

    # TS_VWO_005 (High, Security, 4 cases) Pre: MFA enabled, Enterprise SSO Account Setup
    ["TC_005_01", "Security", "Login with MFA-enabled account", "MFA enabled", "1. Enter valid credentials\n2. Click Login", "Prompts for MFA code/token", "High"],
    ["TC_005_02", "Security", "Submit valid MFA token", "MFA prompted", "1. Enter valid MFA token", "Successful login", "High"],
    ["TC_005_03", "Security", "Submit invalid/expired MFA token", "MFA prompted", "1. Enter invalid MFA token", "Login fails. Error msg: Needs clarification", "High"],
    ["TC_005_04", "Security", "Login with Enterprise SSO", "Enterprise SSO Account Setup", "1. Click SSO Login option\n2. Authenticate with IDP", "Successful SSO login and redirect to dashboard. Needs clarification on IDP details.", "High"],

    # TS_VWO_006 (Medium, Functional, 2 cases) Pre: User on login page
    ["TC_006_01", "Functional", "Verify Remember Me persistence", "User on login page", "1. Check 'Remember Me'\n2. Login\n3. Close browser\n4. Re-open app.vwo.com", "Session resumed automatically without re-login. Timeout: Needs clarification", "Medium"],
    ["TC_006_02", "Functional", "Verify Remember Me unchecked", "User on login page", "1. Uncheck 'Remember Me'\n2. Login\n3. Close browser\n4. Re-open", "Session not resumed, prompts for login", "Medium"],

    # TS_VWO_007 (High, Security, 3 cases) Pre: Registered or Logged in User session
    ["TC_007_01", "Security", "Verify Session Idle Timeout", "Logged in User session", "1. Leave session idle for timeout period", "Session expires. Timeout duration: Needs clarification", "High"],
    ["TC_007_02", "Security", "Verify concurrent logins from different browsers", "Logged in User session", "1. Login on Browser A\n2. Login on Browser B", "Session behavior (kill old or block new): Needs clarification", "High"],
    ["TC_007_03", "Security", "Verify logout invalidates session", "Logged in User session", "1. Click Logout\n2. Click browser Back button", "Redirects to login page, cannot access secure pages", "High"],

    # TS_VWO_008 (High, Performance, 3 cases) Pre: Standard Network connection settings
    ["TC_008_01", "Performance", "Verify page load speed", "Standard Network connection settings", "1. Navigate to app.vwo.com", "Page loads in < 2 seconds", "High"],
    ["TC_008_02", "Performance", "Verify login response time", "Standard Network connection settings", "1. Submit valid credentials", "Login authenticated and dashboard loaded within defined SLA. SLA: Needs clarification", "High"],
    ["TC_008_03", "Performance", "Verify Global CDN caching for static assets", "Standard Network connection settings", "1. Inspect network trace on page load", "Static assets fetched via CDN (Needs clarification on specific CDN providers/headers)", "High"],

    # TS_VWO_009 (High, Security, 2 cases) Pre: User with invalid credentials repeatedly testing
    ["TC_009_01", "Security", "Verify account lockout after N failed attempts", "User with invalid credentials repeatedly testing", "1. Attempt login with invalid password N times", "Account locks. Number of attempts 'N': Needs clarification", "High"],
    ["TC_009_02", "Security", "Verify login after lockout duration", "Locked account", "1. Wait for lockout duration\n2. Attempt login with valid credentials", "Successful login. Lockout duration: Needs clarification", "High"],

    # TS_VWO_010 (Medium, Functional, 8 cases) Pre: Multiple device types available for access
    ["TC_010_01", "Functional", "UI rendered correctly on Desktop", "Multiple device types available for access", "1. Open app.vwo.com on Desktop browser (1080p)", "Elements are aligned, readable, and functional. Needs clarification for exact supported resolutions.", "Medium"],
    ["TC_010_02", "Functional", "UI rendered correctly on Mobile (Portrait)", "Multiple device types available for access", "1. Open app.vwo.com on MobilePortrait", "Elements stack properly, responsive layout. Needs clarification on specific breakpoints.", "Medium"],
    ["TC_010_03", "Functional", "UI rendered correctly on Mobile (Landscape)", "Multiple device types available for access", "1. Open app.vwo.com on MobileLandscape", "Responsive layout handles orientation. Needs clarification.", "Medium"],
    ["TC_010_04", "Functional", "UI rendered correctly on Tablet", "Multiple device types available for access", "1. Open app.vwo.com on Tablet", "Responsive layout. Needs clarification.", "Medium"],
    ["TC_010_05", "Functional", "Verify zoom up to 200%", "Multiple device types available for access", "1. Zoom page to 200%", "Content remains visible and usable without overlapping.", "Medium"],
    ["TC_010_06", "Functional", "Cross-browser compatibility: Chrome", "Multiple device types available for access", "1. Open on Chrome", "Works correctly.", "Medium"],
    ["TC_010_07", "Functional", "Cross-browser compatibility: Firefox", "Multiple device types available for access", "1. Open on Firefox", "Works correctly.", "Medium"],
    ["TC_010_08", "Functional", "Cross-browser compatibility: Safari/Edge", "Multiple device types available for access", "1. Open on Safari/Edge", "Works correctly.", "Medium"],

    # TS_VWO_011 (Medium, Accessibility, 5 cases) Pre: Vision impaired settings enabled (WCAG)
    ["TC_011_01", "Accessibility", "Keyboard Navigation (Tab)", "Vision impaired settings enabled (WCAG)", "1. Use 'Tab' key to navigate", "Focus moves logically through all interactive elements.", "Medium"],
    ["TC_011_02", "Accessibility", "Screen Reader compatibility", "Vision impaired settings enabled (WCAG)", "1. Use screen reader (e.g., NVDA, VoiceOver)", "Form fields have proper labels and ARIA attributes.", "Medium"],
    ["TC_011_03", "Accessibility", "Color Contrast requirements", "Vision impaired settings enabled (WCAG)", "1. Run contrast checker tool", "Text and interactive elements meet WCAG AA/AAA contrast ratios. Needs clarification.", "Medium"],
    ["TC_011_04", "Accessibility", "Visible focus indicators", "Vision impaired settings enabled (WCAG)", "1. Tab through elements", "Focused elements have clear visual indication.", "Medium"],
    ["TC_011_05", "Accessibility", "Form error announcement", "Vision impaired settings enabled (WCAG)", "1. Submit invalid form with screen reader on", "Errors are announced clearly to the user.", "Medium"],

    # TS_VWO_012 (High, Security, 4 cases) Pre: Web debugging proxy tool enabled / User is on login page
    ["TC_012_01", "Security", "Prevent SQL Injection (SQLi) in Username", "Web debugging proxy tool enabled / User is on login page", "1. Enter SQLi payload (' OR 1=1 --) in Username\n2. Submit", "Payload sanitized, login fails. No DB errors shown.", "High"],
    ["TC_012_02", "Security", "Prevent Cross-Site Scripting (XSS) in fields", "Web debugging proxy tool enabled / User is on login page", "1. Enter XSS payload (<script>alert(1)</script>)\n2. Submit", "Payload sanitized/encoded, no script execution.", "High"],
    ["TC_012_03", "Security", "Verify secure transmission (HTTPS)", "User is on login page", "1. Check page URL scheme and certificate", "Uses HTTPS with valid SSL certificate.", "High"],
    ["TC_012_04", "Security", "Verify proper security headers", "Web debugging proxy tool enabled", "1. Inspect HTTP response headers", "Headers (e.g., CSP, X-Frame-Options) present. Needs clarification on specific requirements.", "High"]
]

df = pd.DataFrame(data, columns=["TID", "Category", "Description", "Pre-conditions", "Steps", "Expected", "Priority"])
output_path = r"w:\The Testing Acedamy\Antigravity\My Projects\Project_01_VWO\Test_ Delivarables_Outcome\VWO_Test_Case.xlsx"
df.to_excel(output_path, index=False)
print(f"File saved to {output_path}")
