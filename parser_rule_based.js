/**
 * @file parser_rule_based.gs
 * @description
 * Rule-based parser for extracting structured data from receipt OCR text.
 * Parses:
 *  - Amount (with heuristics and confidence scoring)
 *  - Date (keyword-prioritized)
 *  - Vendor (top-of-receipt heuristics, deprioritize emails)
 *  - Description (removes redundant labels)
 *  - Uploader (Drive metadata)
 * Designed for auditability and easy swapping with ML-based parser.
 */

/**
 * @typedef {Object} ParsedReceipt
 * @property {string} date - The date of the transaction
 * @property {string} fileName - File name from Drive
 * @property {string} vendor - Vendor name (with heuristics to avoid emails/phones)
 * @property {string} description - Description of service/item (cleaned of labels)
 * @property {string} category - Categorized expense (from CategoryClassifier)
 * @property {number} amount - Total transaction amount
 * @property {number} confidence - Confidence score (0-100) for heuristics
 * @property {string} uploader - File owner from Drive
 * @property {string} url - Drive file URL
 * @property {string} hash - Unique hash for deduplication
 * @property {string} rawText - Full OCR text (for logging/debug)
 * @property {string} humanCorrection - Optional column for manual override
 */

/**
 * VisionParser
 * 
 * Rule-based parser for structured receipt extraction.
 */
const VisionParser = {
  
  /**
   * Main parser entry point
   * @param {string} fullText - Raw OCR text from Vision/Drive
   * @param {GoogleAppsScript.Drive.File} file - Optional Drive file for uploader info
   * @returns {ParsedReceipt}
   */
  parseFromText(fullText, file) {
    const amount = this.extractAmount(fullText);
    const date = this.extractDate(fullText);
    const vendor = this.extractVendor(fullText);
    const description = this.extractDescription(fullText);
    const confidence = this.calculateConfidence(fullText);

    // Uploader info
    const uploader = file && file.getOwner ? file.getOwner().getName() : "Unknown";

    return {
      date,
      fileName: file ? file.getName() : "Unknown",
      vendor,
      description,
      category: "", // To be filled by CategoryClassifier later
      amount,
      confidence,
      uploader,
      url: file ? file.getUrl() : "",
      hash: "",
      rawText: fullText,
      humanCorrection: ""
    };
  },

  /**
   * Extracts the most likely total amount using heuristics.
   * @param {string} text
   * @returns {number}
   */
  extractAmount(text) {
    const matches = [...text.matchAll(/\$?\s?(\d{1,4}(?:,\d{3})*\.\d{2})/g)];
    if (!matches.length) return 0;

    const lines = text.split("\n").map(l => l.trim());
    let candidates = matches.map(match => {
      const value = parseFloat(match[1].replace(/,/g, ""));
      const line = lines.find(l => l.includes(match[0])) || "";

      let score = 0;
      if (/total|amount due|balance/i.test(line)) score += 100;
      if (/subtotal/i.test(line)) score -= 40;
      if (/tax/i.test(line)) score -= 30;
      if (/tip/i.test(line)) score -= 20;

      return { value, score, line };
    });

    // Boost max value slightly
    const maxValue = Math.max(...candidates.map(c => c.value));
    candidates = candidates.map(c => {
      if (c.value === maxValue) c.score += 25;
      return c;
    });

    candidates.sort((a, b) => b.score - a.score);
    return candidates[0].value;
  },

  /**
   * Extracts a likely transaction date based on keywords.
   * @param {string} text
   * @returns {string}
   */
  extractDate(text) {
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const keywordRegex = /(transaction date|service date|date of service|date)/i;

    const lines = text.split("\n");
    for (let line of lines) {
      if (keywordRegex.test(line)) {
        const match = line.match(dateRegex);
        if (match) return match[0];
      }
    }

    // fallback: first date in document
    const fallback = text.match(dateRegex);
    return fallback ? fallback[0] : new Date().toLocaleDateString();
  },

  /**
   * Extract vendor using top-of-document heuristics.
   * Deprioritizes email addresses and phone numbers.
   * @param {string} text
   * @returns {string}
   */
  extractVendor(text) {
    const lines = text.split("\n").map(l => l.trim());
    for (let line of lines) {
      // Skip empty lines or lines with emails/phones
      if (/^$/.test(line)) continue;
      if (/[\w._%+-]+@[\w.-]+\.[a-z]{2,}$/i.test(line)) continue;
      if (/(\+?\d[\d\s.-]{6,}\d)/.test(line)) continue;

      // Take first line that seems like vendor
      return line;
    }
    return "Unknown Vendor";
  },

  /**
   * Extract description, avoiding redundant label text.
   * @param {string} text
   * @returns {string}
   */
  extractDescription(text) {
    const lines = text.split("\n").map(l => l.trim());
    for (let line of lines) {
      if (/description/i.test(line)) {
        // remove the word "Description" from text
        return line.replace(/description[:\s]*/i, "").trim();
      }
    }
    return "";
  },

  /**
   * Simple confidence scoring based on heuristics.
   * @param {string} text
   * @returns {number}
   */
  calculateConfidence(text) {
    let score = 50; // base
    if (/total/i.test(text)) score += 20;
    if (/amount due/i.test(text)) score += 20;
    return Math.min(score, 100);
  }
};