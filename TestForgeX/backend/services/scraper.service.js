import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import chromium from '@sparticuz/chromium';
import puppeteerCore from 'puppeteer-core';
import * as cheerio from 'cheerio';

const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

if (!isProduction) {
  puppeteerExtra.use(StealthPlugin());
}

class ScraperService {
  constructor() {
    this.browser = null;
  }

  /**
   * Initialize browser instance
   */
  async _init() {
    if (!this.browser) {
      if (isProduction) {
        // VERCEL / AWS LAMBDA ENVIRONMENT
        console.log(`[Scraper] Initializing Serverless Chromium...`);
        this.browser = await puppeteerCore.launch({
          args: chromium.args,
          defaultViewport: chromium.defaultViewport,
          executablePath: await chromium.executablePath(),
          headless: chromium.headless,
          ignoreHTTPSErrors: true,
        });
      } else {
        // LOCALHOST ENVIRONMENT
        console.log(`[Scraper] Initializing Local Chromium...`);
        this.browser = await puppeteerExtra.launch({
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
      }
    }
    return this.browser;
  }

  /**
   * Step 1: Web Scraping — Dynamic Content Support
   */
  async scrape(url) {
    let browser, page;
    try {
      browser = await this._init();
      page = await browser.newPage();
      
      console.log(`[Scraper] Navigating to: ${url}`);
      // Use 'domcontentloaded' instead of 'networkidle0' for much faster and more reliable loading
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Wait a small extra bit for static content
      await new Promise(r => setTimeout(r, 1000));
      
      const title = await page.title();
      const html = await page.content();
      const data = this.extractDetails(html);
      
      return { url, title, ...data };
    } catch (err) {
      console.warn(`[Scraper] Puppeteer failed for ${url}: ${err.message}. Returning minimal trace.`);
      return { url, title: "Unknown Page", elements: [], visible_text: "Navigation failed" };
    } finally {
      if (page) await page.close();
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
