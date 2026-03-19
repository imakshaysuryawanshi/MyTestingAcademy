# Test Plan: VWO.com Login Dashboard

## 1. Test Plan ID
**TP-VWO-001**

## 2. Objective
In this document of the Test Plan for the VWO application, the goal is to validate the login dashboard at `app.vwo.com`.
The primary objective is to ensure a secure, intuitive, and efficient login experience that seamlessly connects users to VWO's powerful optimization platform while maintaining enterprise-grade security standards (such as SSO and MFA) and exceptional user experience.
The testing will ensure the application is functionally sound, performant (Page Load < 2 seconds), and accessible (WCAG 2.1 AA compliance).

## 3. Scope
**Inclusions:**
- Login Page (app.vwo.com)
- Create Account / Free Trial Signup flow
- Dashboard Page (Immediate post-login transition)
- Password Management (Forgot Password, Reset flow)
- Security features (Session management, MFA, SSO integration)
- Accessibility Features (Screen reader support, Keyboard Navigation, High Contrast)
- Performance validation (Load time, CDN delivery)

**Exclusions:**
- Support Page
- Support Widget - ZOHO chat
- Core VWO A/B testing dashboard functionalities (beyond successful navigation post-authentication)

## 4. Test Environments
- **Operating Systems**: Windows 10, macOS, Linux, iOS, Android.
- **Browsers**: Google Chrome, Mozilla Firefox, Microsoft Edge, Safari.
- **Device Types**: Desktop computers, laptops, tablets, and smartphones.
- **Network**: Wi-Fi, cellular, wired connections.
- **Staging Platforms**:
  - QA: `qa.vwo.com`
  - Pre Prod: `preprod.vwo.com`
  - UAT: `uat.vwo.com`
  - Prod: `app.vwo.com`

## 5. Defect Reporting Procedure
- **Defect Tracking Tool:** JIRA
- **Process:** Defects will be logged using a standard template with steps to reproduce, expected results, actual results, severity, logs, and screenshots attached.
- **Triage:** Defects will be assigned priority and severity levels for resolution.
- **Points of Contact:**
  - New Frontend: Devesh
  - Backend: Sonal
  - Dev Ops: Prajeeth

## 6. Test Strategy
- **Phase 1: Core Authentication** (Functional and Security testing of email/password login, error handling)
- **Phase 2: Enhanced UX** (Mobile responsiveness, Exploratory testing, Accessibility review)
- **Phase 3: Enterprise Features** (MFA, SSO validation, Load/Performance testing)
- Techniques utilized will include Equivalence Partitioning, Boundary Value Analysis, Decision Tables, Error Guessing, and End-to-End flow testing.
- An initial Smoke Testing/Sanity cycle will decide whether to accept or reject the build before performing Regression or in-depth testing.

## 7. Test Schedule
- **Sprint 1:** Creating Test Plan, Test Case Creation, Setup Environment
- **Sprint 2:** Test Execution, Bug Reporting, End-to-End Flow validation, Summary Report submission

## 8. Test Deliverables
- VWO_Test_Plan.md (This Document)
- VWO_Test_Scenario.xlsx (Test Scenarios Mapping)
- Automated Test Scripts (When applicable)
- Bug Reports in JIRA
- Defect Summary and Execution Matrix

## 9. Entry Criteria
- The requirements and PRD have been fully reviewed and understood by the testing team.
- Environments (QA/UAT) are set up and available.
- The build has successfully passed the unit tests and deployment pipelines.
- Test Scenarios and Test Cases are signed-off by the Client.

## 10. Exit Criteria
- 100% execution of high priority test cases.
- All high severity/priority defects are fixed and closed.
- Test Summary Reports and Defect Reports have been prepared.
- Page Load Time maintains sub-2-second metric.
- No P1/P2 accessibility or security vulnerabilities remain open.

## 11. Test Execution
- Multiple resources will execute tests simultaneously on the supported test environments.
- Defect status updates will be sent at the end of each day.
- Shift Left Testing will be integrated for proactive identification.

## 12. Tools
- **JIRA** (Defect Tracking)
- **Mind map Tool** (Scenario exploration)
- **Snipping Screenshot Tool**
- **Word and Excel documents** (Test Scenarios, Planning)
- Performance / Automation proxies when integrated

## 13. Risks and Mitigations
- **Risk:** Unexpected downtime of QA/Staging environments.
  **Mitigation:** Resources will be reallocated to other tasks, and Ops support (Prajeeth) kept on stand-by.
- **Risk:** Unavailability of testing resources.
  **Mitigation:** Cross-training and backup resource planning.
- **Risk:** Security vulnerabilities or complex enterprise testing (SSO/MFA) taking too much time.
  **Mitigation:** Prioritizing security flows early in Sprint 1 and engaging DevOps early for SSO simulation.

## 14. Approvals
Testing will proceed effectively upon client and stakeholder approval of:
- Test Plan
- Test Scenarios
- Output Reports
