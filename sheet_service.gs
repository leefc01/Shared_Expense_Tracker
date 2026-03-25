// sheet_service.gs
const SheetService = {
  getReceiptsSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("Receipts");
    if (!sheet) sheet = ss.insertSheet("Receipts");

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Date",
        "File Name",
        "Vendor",
        "Description",
        "Category",
        "Amount",
        "Confidence",
        "Uploader",
        "File URL",
        "Hash",
        "Human Correction",
        "Raw OCR Text"
      ]);
    }
    return sheet;
  },

  getLogSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName("OCR Logs");
    if (!sheet) sheet = ss.insertSheet("OCR Logs");
    return sheet;
  },

  getExistingHashes(sheet) {
    const data = sheet.getRange(2, 10, sheet.getLastRow() - 1, 1).getValues();
    return new Set(data.flat().filter(Boolean));
  },

  appendReceipt(sheet, parsed) {
    sheet.appendRow([
      parsed.date,
      parsed.fileName,
      parsed.vendor,
      parsed.description,
      parsed.category || "",
      parsed.amount,
      parsed.confidence,
      parsed.uploader,
      parsed.url,
      parsed.hash,
      parsed.humanCorrection || "",
      parsed.rawText
    ]);
  },

  logOCR(sheet, fileName, text) {
    sheet.appendRow([new Date(), fileName, text]);
  }
};
