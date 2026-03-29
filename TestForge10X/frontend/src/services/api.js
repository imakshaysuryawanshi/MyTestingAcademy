/**
 * Mock API Layer (Phase 11: API Contract & Phase 13: AI Optimization)
 * Integrates Retry Mechanisms, JSON structural validation (Phase 10: Reliability)
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Wrapper for simulated network requests with retires
const fetchWithRetry = async (mockFn, retries = 2) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await mockFn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await delay(1000); // Backoff
    }
  }
};

// Base URL for production vs development
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const api = {
  // POST /api/jira/fetch
  fetchJira: async (payload) => {
    return fetchWithRetry(async () => {
      await delay(1500);
      if (!payload.url || !payload.email || !payload.token) {
        throw new Error("Missing required Jira credentials configuration.");
      }
      
      // Return strict JSON Mock (Phase 3 format)
      return {
        success: true,
        data: [
          {
            id: `TFX-${Math.floor(Math.random() * 1000)}`,
            title: "Implement SSO login via Google",
            acceptanceCriteria: "1. SSO button visible. 2. Redirects to Google payload. 3. Authenticates successfully."
          },
          {
            id: `TFX-${Math.floor(Math.random() * 1000)}`,
            title: "Export Data to CSV",
            acceptanceCriteria: "1. Export button on dashboard. 2. Downloads CSV of testcases."
          }
        ]
      };
    });
  },

  // POST /api/testcases/generate -> Call Real Llama3 Backend
  generateTestCases: async (story) => {
    return fetchWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s timeout for LLM
      try {
        const response = await fetch(`${API_BASE_URL}/api/testcases/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ story }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const json = await response.json();
        
        if (json.success && json.data) {
          // Flatten AI JSON structure with multiple fallbacks
          let testCasesArray = json.data.test_cases || json.data.test_case || json.data.cases || json.data.result || json.data;
          
          if (!Array.isArray(testCasesArray)) {
              // If it's a single object, wrap it
              testCasesArray = (testCasesArray && typeof testCasesArray === 'object') ? [testCasesArray] : [];
          }
          return { success: true, data: testCasesArray };
        } else {
          throw new Error(json.error || 'Failed to generate test cases via AI');
        }
      } catch (err) {
        console.error("LLM Generation API Error:", err);
        throw err;
      }
    });
  },

  // Phase 21+22: Code Generation — real data injection + locator intelligence
  generateCode: async (testCaseData) => {
    return fetchWithRetry(async () => {
      await delay(2500);

      // Accept either a plain string (legacy) or a full object (Phase 21+)
      const isLegacy = typeof testCaseData === 'string';
      const title    = isLegacy ? testCaseData : (testCaseData.title || 'UnknownTest');
      const url      = isLegacy ? 'https://example.com' : (testCaseData.url || testCaseData.test_plan?.url || 'https://your-app.com');
      const steps    = isLegacy ? [] : (testCaseData.steps || []);
      const elements = isLegacy ? [] : (testCaseData.elements || []);

      // Phase 22: parseLocator helper — maps "type=value" → By.XXX("value")
      const parseLocator = (locStr) => {
        if (!locStr) return null;
        const [type, ...rest] = locStr.split('=');
        const val = rest.join('=');
        switch (type.toLowerCase()) {
          case 'id':    return `By.id("${val}")`;
          case 'name':  return `By.name("${val}")`;
          case 'css':   return `By.cssSelector("${val}")`;
          case 'xpath': return `By.xpath("${val}")`;
          default:      return `By.id("${val}")`;
        }
      };

      // Build intelligent step→action lines (Phase 22: use real locators when available)
      const buildActions = () => {
        if (steps.length === 0 && elements.length === 0) {
          return `        driver.findElement(By.id("submit-btn")).click();\n        Assert.assertTrue(driver.getCurrentUrl().contains("success"));`;
        }

        const lines = [];
        const usedSteps = steps.length > 0 ? steps : ['Interact with UI', 'Verify outcome'];
        usedSteps.forEach((step, idx) => {
          const stepText = typeof step === 'string' ? step : (step.action || step.description || `Step ${idx + 1}`);
          const stepLower = stepText.toLowerCase();

          // Try to find a matching element from the URL Analyzer output
          const matched = elements.find(el => {
            const elName = (el.id || el.name || el.text || '').toLowerCase();
            return elName && stepLower.includes(elName.replace(/-/g, ' ').replace(/_/g, ' '));
          });

          const locatorStr = matched ? (
            matched.id    ? `By.id("${matched.id}")`
          : matched.name  ? `By.name("${matched.name}")`
          : `By.cssSelector("[data-testid='${matched.id || 'element'}']")`
          ) : null;

          if (stepLower.includes('open') || stepLower.includes('navigate') || stepLower.includes('go to')) {
            lines.push(`        // ${stepText}`);
            lines.push(`        driver.get("${url}");`);
          } else if (stepLower.includes('click') || stepLower.includes('press') || stepLower.includes('submit')) {
            const loc = locatorStr || (matched ? parseLocator(matched.locator) : `By.xpath("//${  stepLower.includes('button') ? 'button' : 'a'}[contains(text(),'${stepText.split(' ').pop()}')]")`);
            lines.push(`        // ${stepText}`);
            lines.push(`        driver.findElement(${loc}).click();`);
          } else if (stepLower.includes('enter') || stepLower.includes('fill') || stepLower.includes('type') || stepLower.includes('input')) {
            const loc = locatorStr || `By.name("input_${idx}")`;
            const value = stepLower.includes('password') ? '"testPassword@123"' : '"test_input_value"';
            lines.push(`        // ${stepText}`);
            lines.push(`        driver.findElement(${loc}).sendKeys(${value});`);
          } else if (stepLower.includes('verify') || stepLower.includes('assert') || stepLower.includes('check') || stepLower.includes('see')) {
            lines.push(`        // ${stepText}`);
            lines.push(`        Assert.assertTrue(driver.getCurrentUrl().contains("${url.split('/')[2] || 'app'}") || driver.getPageSource().contains("success"), "Assertion failed: ${stepText}");`);
          } else {
            const loc = locatorStr || `By.xpath("//*[contains(text(),'${stepText.split(' ').slice(-2).join(' ')}')]")`;
            lines.push(`        // ${stepText}`);
            lines.push(`        driver.findElement(${loc}).click();`);
          }
        });
        return lines.join('\n');
      };

      const methodName = title.replace(/[^a-zA-Z0-9]/g, '_').replace(/^_+|_+$/g, '').replace(/^(\d)/, '_$1');
      const className  = methodName.charAt(0).toUpperCase() + methodName.slice(1) + 'Test';

      return {
        success: true,
        data: `// Auto-generated by TestForgeX CodeGen Studio (Phase 21+22)
// Test Case: ${title}
// Target URL: ${url}
// Elements injected: ${elements.length}

import io.github.bonigarcia.wdm.WebDriverManager;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.testng.Assert;
import org.testng.annotations.AfterMethod;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;
import java.time.Duration;

public class ${className} {

    private WebDriver driver;
    private WebDriverWait wait;

    @BeforeMethod
    public void setUp() {
        WebDriverManager.chromedriver().setup();
        driver = new ChromeDriver();
        wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        driver.manage().window().maximize();
    }

    @Test
    public void ${methodName}() {
        // Navigate to target URL
        driver.get("${url}");

${buildActions()}

    }

    @AfterMethod
    public void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
`
      };
    });
  },

  // Phase 9: URL Analyzer — Real AI Integration
  analyzeURL: async (url) => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/api/url/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await response.json();
      if (json.success) return { success: true, data: json.data };
      throw new Error(json.error || 'Failed to analyze URL');
    });
  },

  // Phase 4: Test Plan
  generateTestPlan: async (payload) => {
    return fetchWithRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 300s timeout
      try {
        const response = await fetch(`${API_BASE_URL}/api/testplan/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: payload.title || payload.context || payload,
            criteria: payload.criteria || "" 
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        const json = await response.json();
        if (json.success) return { success: true, data: json.data };
        throw new Error(json.error || 'Failed to generate test plan');
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    });
  },

  // Phase 14: User Stories — Real AI Integration
  generateUserStories: async (sourceType, sourceData) => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/api/userstory/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: sourceData })
      });
      const json = await response.json();
      if (json.success) return { success: true, data: json.data };
      throw new Error(json.error || 'Failed to generate User Stories');
    });
  },

  // Phase 7: Coverage — Real AI Integration
  analyzeCoverage: async (testCases) => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/api/coverage/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testCases })
      });
      const json = await response.json();
      if (json.success) return { success: true, data: json.data };
      throw new Error(json.error || 'Failed to analyze coverage');
    });
  },

  // Phase 15: Settings Prompt Loader
  fetchAvailablePrompts: async () => {
    return fetchWithRetry(async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/ping-prompts`);
        const json = await response.json();
        return { success: true, data: json.loaded_prompts };
      } catch (e) {
        // Fallback array if backend isn't mapped
        return { success: true, data: ['testplan/universal', 'testcase/universal', 'codegen/selenium-java', 'coverage/analysis', 'userstory/generator', 'url-analysis/universal'] };
      }
    });
  },

  // Phase 18: Test Scenario Generation
  generateScenarios: async (story) => {
    return fetchWithRetry(async () => {
      const response = await fetch(`${API_BASE_URL}/api/scenarios/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ story })
      });
      const json = await response.json();
      if (json.success && json.data) {
        return { success: true, data: json.data.test_scenarios || json.data };
      }
      throw new Error(json.error || 'Failed to generate scenarios');
    });
  }
};
