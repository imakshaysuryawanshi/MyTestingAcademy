import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';

class ScraperService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async _init() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  /**
   * Step 1: Web Scraping — Dynamic Content Support
   */
  async scrape(url) {
    const browser = await this._init();
    const page = await browser.newPage();
    
    try {
      console.log(`[Scraper] Navigating to: ${url}`);
      // Use 'domcontentloaded' instead of 'networkidle0' for much faster and more reliable loading
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait a small extra bit for static content
      await new Promise(r => setTimeout(r, 2000));
      
      const title = await page.title();
      const html = await page.content();
      const data = this.extractDetails(html);
      
      return { url, title, ...data };
    } catch (err) {
      console.warn(`[Scraper] Puppeteer failed for ${url}: ${err.message}. Returning minimal trace.`);
      return { url, title: "Unknown Page", elements: [], visible_text: "Navigation failed" };
    } finally {
      await page.close();
    }
  }

  /**
   * Step 2 & 3: DOM Cleaning + Content Extraction
   */
  extractDetails(html) {
    const $ = cheerio.load(html);

    // Step 2: Cleaning (Remove noise)
    $('script, style, noscript, iframe, link').remove();
    
    // Step 3: Extract Meaningful Sections
    const elements = [];
    
    // Headings
    $('h1, h2, h3').each((i, el) => {
      elements.push({ type: 'heading', text: $(el).text().trim(), level: el.name });
    });

    // Actionable Items (Buttons & Links)
    $('button, a').each((i, el) => {
        const text = $(el).text().trim();
        const icon = $(el).find('svg').length > 0;
        if (text || icon) {
            elements.push({ 
                type: el.name === 'button' ? 'button' : 'link', 
                text: text || (icon ? "Icon Action" : ""),
                id: $(el).attr('id') || '',
                name: $(el).attr('name') || '',
                className: $(el).attr('class') || '',
                href: $(el).attr('href') || ''
            });
        }
    });

    // Forms
    $('form').each((i, el) => {
        const inputs = [];
        $(el).find('input').each((j, inp) => {
            inputs.push({
                type: 'input',
                inputType: $(inp).attr('type'),
                name: $(inp).attr('name') || $(inp).attr('id') || '',
                placeholder: $(inp).attr('placeholder') || ''
            });
        });
        elements.push({ type: 'form', action: $(el).attr('action'), inputs });
    });

    // Visible text for summary
    const visibleText = $('body').text().replace(/\s+/g, ' ').trim();

    return {
      elements: elements.slice(0, 50), // Token control limit
      visible_text: visibleText.substring(0, 4000) // Step 5: Optimization
    };
  }
}

export const scraperService = new ScraperService();
