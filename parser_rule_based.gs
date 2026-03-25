// parser_rule_based.gs
const VisionParser = {
  extractText(file) {
    const mime = file.getMimeType();

    if (mime.includes("image") || mime === "application/pdf") {
      return VisionService.extractText(file);
    }

    if (mime.includes("text")) {
      return file.getBlob().getDataAsString();
    }

    if (mime.includes("google-apps.document")) {
      return DocumentApp.openById(file.getId()).getBody().getText();
    }

    return null;
  },

  parse(file) {
    const text = this.extractText(file);
    if (!text) return null;

    const lines = this.preprocessLines(text);

    const { amount, confidence } = this.extractAmount(lines);
    const date = this.extractDate(lines);
    const vendor = this.extractVendor(lines);
    const description = this.extractDescription(lines, vendor, date);
    const uploader = this.extractUploader(file);

    return {
      amount,
      confidence,
      vendor,
      date,
      description,
      uploader,
      rawText: text,
      humanCorrection: "" // New column for manual fixes
    };
  },

  preprocessLines(text) {
    return text
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.length > 2);
  },

  extractAmount(lines) {
    const text = lines.join("\n");
    const matches = [...text.matchAll(/\$?\s?(\d{1,4}(?:,\d{3})*\.\d{2})/g)];

    if (!matches.length) return { amount: "Check Manually", confidence: 0 };

    let best = { value: 0, score: -999 };

    matches.forEach(m => {
      const value = parseFloat(m[1].replace(/,/g, ""));
      let score = 0;

      if (/total|amount due|balance|grand total/i.test(text)) score += 100;
      if (value > best.value) score += 20;

      if (score > best.score) best = { value, score };
    });

    return {
      amount: best.value.toFixed(2),
      confidence: Math.min(100, best.score)
    };
  },

  extractDate(lines) {
    const keywordRegex = /(transaction date|service date|date of service|date)/i;
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{2,4})/;

    for (let line of lines) {
      if (keywordRegex.test(line)) {
        const match = line.match(dateRegex);
        if (match) return match[1];
      }
    }

    for (let line of lines) {
      const match = line.match(dateRegex);
      if (match) return match[1];
    }

    return new Date();
  },

  extractVendor(lines) {
    let candidates = [];

    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (this.isPhoneNumber(line)) continue;
      if (this.isDateLine(line)) continue;
      if (/\d{3,}/.test(line)) continue;
      if (/receipt|invoice|total/i.test(line)) continue;

      let score = 50;
      if (this.isEmail(line)) score -= 40;

      candidates.push({ line, score });
    }

    if (candidates.length) {
      candidates.sort((a, b) => b.score - a.score);
      return candidates[0].line;
    }

    return "Unknown Vendor";
  },

  extractDescription(lines, vendor, date) {
    let candidates = [];

    for (let line of lines) {
      let score = 0;
      if (line === vendor) continue;
      if (line.includes(date)) continue;
      if (this.isDateLine(line)) continue;

      line = line.replace(/^(Description|Service|Item|Notes)\s*[:\-]\s*/i, '').trim();
      if (!line) continue;

      if (/service|repair|maintenance|cleaning|installation/i.test(line)) score += 50;
      if (/for\s+/i.test(line)) score += 40;
      if (line.split(" ").length > 3) score += 10;

      if (/total|tax|subtotal|balance/i.test(line)) score -= 50;
      if (/^\$?\d+/.test(line)) score -= 30;

      candidates.push({ line, score });
    }

    candidates.sort((a, b) => b.score - a.score);

    if (candidates.length && candidates[0].score > 0) return candidates[0].line;
    return "No description found";
  },

  extractUploader(file) {
    try {
      return file.getOwner() ? file.getOwner().getName() : "Unknown";
    } catch (e) {
      return "Unknown";
    }
  },

  isPhoneNumber(line) {
    return /(\(\d{3}\)|\d{3}[-.\s]?)\d{3}[-.\s]?\d{4}/.test(line);
  },

  isDateLine(line) {
    return /(date|transaction)/i.test(line);
  },

  isEmail(line) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(line);
  }
};
