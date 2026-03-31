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
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    try {
      browser = await this._init();
      // Verifiy browser is still healthy
      if (!browser.isConnected()) {
        console.warn(`[Scraper] Browser disconnected. Re-initializing...`);
        this.browser = null;
        browser = await this._init();
      }

      page = await browser.newPage();
      
      // Step 2: Anti-detection (Mimic real user)
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
      ];
      await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
      await page.setViewport({ width: 1440, height: 900 });

      console.log(`[Scraper] Navigating to: ${normalizedUrl}`);
      
      // Step 3: Fast Navigation
      const response = await page.goto(normalizedUrl, { 
        waitUntil: 'domcontentloaded', 
        timeout: 25000 
      });

      const status = response?.status() || 200;
      const title = await page.title();
      const html = await page.content();
      
      // Step 4: Intelligent Extraction
      const data = this.extractDetails(html);
      await page.close();

      return {
        url: normalizedUrl,
        title,
        status,
        ...data
      };
    } catch (err) {
      console.error(`[Scraper] Puppeteer failed for ${normalizedUrl}: ${err.message}`);
      return { 
        url: normalizedUrl, 
        title: "Blocked / Unavailable", 
        status: 503, 
        elements: [], 
        visible_text: "Navigation failed — site may be protected or unreachable" 
      };
    } finally {
      if (page) await page.close().catch(() => {});
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
        const id = $(el).attr('id') || '';
        const name = $(el).attr('name') || '';
        elements.push({ type: 'form', id, name });
    });

    // Step 4: Cap the elements to stay within LLM context tokens (Limit: 100 items)
    const cappedElements = elements.slice(0, 100);

    return {
      elements: cappedElements,
      visible_text: $('body').text().slice(0, 3000).replace(/\s+/g, ' ').trim()
    };
  }
}

export const scraperService = new ScraperService();
