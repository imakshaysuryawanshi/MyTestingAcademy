import axios from 'axios';

/**
 * Jira Service
 * Handles Atlassian Jira Cloud API integration for fetching user stories.
 */
class JiraService {
    /**
     * Fetch a single issue from Jira
     * @param {string} issueId - Issue Key (e.g. TFX-101)
     * @param {object} creds - { url, email, token }
     */
    async fetchIssue(issueId, creds = {}) {
        const url = creds.url || process.env.JIRA_BASE_URL;
        const email = creds.email || process.env.JIRA_EMAIL;
        const token = creds.token || process.env.JIRA_API_TOKEN;

        if (!url || !email || !token) throw new Error("Incomplete Jira credentials. Please provide via UI or backend .env");

        // Normalize URL
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const apiEndpoint = `${cleanUrl}/rest/api/3/issue/${issueId}`;

        // Basic Auth Header (Email + API Token)
        const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

        try {
            const response = await axios.get(apiEndpoint, {
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Accept': 'application/json'
                }
            });

            return this.transformIssue(response.data);
        } catch (error) {
            console.error(`[JiraService] Fetch failed for ${issueId}:`, error.response?.data || error.message);
            throw new Error(`Jira API Error: ${error.response?.data?.errorMessages?.[0] || error.message}`);
        }
    }

    /**
     * Search for issues via JQL (useful for bulk sync)
     */
    async searchIssues(jql, creds = {}) {
        const url = creds.url || process.env.JIRA_BASE_URL;
        const email = creds.email || process.env.JIRA_EMAIL;
        const token = creds.token || process.env.JIRA_API_TOKEN;
        const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        const apiEndpoint = `${cleanUrl}/rest/api/3/search`;
        const authHeader = Buffer.from(`${email}:${token}`).toString('base64');

        try {
            const response = await axios.get(apiEndpoint, {
                params: { jql, maxResults: 50 },
                headers: {
                    'Authorization': `Basic ${authHeader}`,
                    'Accept': 'application/json'
                }
            });

            return response.data.issues.map(issue => this.transformIssue(issue));
        } catch (error) {
            throw new Error(`Jira Search Error: ${error.message}`);
        }
    }

    /**
     * Transform Jira JSON into our story format
     */
    transformIssue(jiraData) {
        const fields = jiraData.fields;
        
        // Jira descriptions can be rich ADF (Atlassian Document Format) or plain text
        // In API v3 it's usually ADF. We'll extract raw text.
        const description = this.extractAdfText(fields.description) || "No description provided.";
        
        // Many teams use a custom field for AC. We'll search for common names.
        // For now, we'll try to find "Acceptance Criteria" in description or use a fallback.
        let ac = "";
        const acRegex = /Acceptance Criteria:?\s*([\s\S]+)/i;
        const match = description.match(acRegex);
        if (match) {
            ac = match[1].trim();
        }

        return {
            id: jiraData.key,
            title: fields.summary,
            description: description,
            acceptanceCriteria: ac || "Not explicitly found in description.",
            status: fields.status?.name,
            project: fields.project?.name,
            raw: jiraData // keep for debugging
        };
    }

    /**
     * Helper to extract plain text from ADF (Atlassian Document Format)
     */
    extractAdfText(adf) {
        if (!adf) return "";
        if (typeof adf === 'string') return adf;
        
        let text = "";
        const traverse = (node) => {
            if (node.type === 'text') {
                text += node.text;
            }
            if (node.content) {
                node.content.forEach(traverse);
            }
        };
        
        if (adf.content) {
            adf.content.forEach(traverse);
        }
        return text;
    }
}

export const jiraService = new JiraService();
