/**
 * VisionParser
 * Rule-based parser for structured receipt extraction.
 */
const VisionParser = {
  parseFromText(fullText, file) {
    const amount = this.extractAmount(fullText);
    const date = this.extractDate(fullText);
    const vendor = this.extractVendor(fullText);
    const description = this.extractDescription(fullText);
    const confidence = this.calculateConfidence(fullText);
    const uploader = file && file.getOwner ? file.getOwner().getName() : "Unknown";

    return { date, fileName: file ? file.getName() : "Unknown", vendor, description,
             category: "", amount, confidence, uploader, url: file ? file.getUrl() : "",
             hash: "", rawText: fullText, humanCorrection: "" };
  },

  extractAmount(text) {
    const matches = [...text.matchAll(/\$?\s?(\d{1,4}(?:,\d{3})*\.\d{2})/g)];
    if (!matches.length) return 0;
    const lines = text.split("\n").map(l => l.trim());
    let candidates = matches.map(m => {
      const value = parseFloat(m[1].replace(/,/g,""));
      const line = lines.find(l => l.includes(m[0])) || "";
      let score = 0;
      APP_DEFAULTS.AMOUNT_KEYWORDS.forEach(k => { if (line.toLowerCase().includes(k)) score += 100; });
      APP_DEFAULTS.SUBTRACT_KEYWORDS.forEach(k => { if (line.toLowerCase().includes(k)) score -= 40; });
      return { value, score, line };
    });
    const maxValue = Math.max(...candidates.map(c=>c.value));
    candidates = candidates.map(c=>{ if(c.value===maxValue)c.score+=25; return c; });
    candidates.sort((a,b)=>b.score-a.score);
    return candidates[0].value;
  },

  extractDate(text) {
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const lines = text.split("\n");
    for (let line of lines) {
      if (APP_DEFAULTS.DATE_KEYWORDS.some(k => line.toLowerCase().includes(k))) {
        const match = line.match(dateRegex);
        if (match) return match[0];
      }
    }
    const fallback = text.match(dateRegex);
    return fallback ? fallback[0] : new Date().toLocaleDateString();
  },

  extractVendor(text) {
    const lines = text.split("\n").map(l=>l.trim());
    for (let line of lines) {
      if (!line || /[\w._%+-]+@[\w.-]+\.[a-z]{2,}/i.test(line)) continue;
      if (/(\+?\d[\d\s.-]{6,}\d)/.test(line)) continue;
      return line;
    }
    return "Unknown Vendor";
  },

  extractDescription(text) {
    const lines = text.split("\n").map(l=>l.trim());
    for (let line of lines) {
      for (const k of APP_DEFAULTS.DESCRIPTION_KEYWORDS) {
        if (line.toLowerCase().includes(k)) return line.replace(new RegExp(k+":?","i"), "").trim();
      }
    }
    return "";
  },

  calculateConfidence(text) {
    let score = APP_DEFAULTS.CONFIDENCE_BASE;
    APP_DEFAULTS.AMOUNT_KEYWORDS.forEach(k=>{ if(text.toLowerCase().includes(k)) score+=APP_DEFAULTS.CONFIDENCE_BOOST; });
    return Math.min(score, APP_DEFAULTS.CONFIDENCE_MAX);
  }
};