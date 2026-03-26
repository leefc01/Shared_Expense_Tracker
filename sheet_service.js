/**
 * @file SheetService.gs
 * @description Handles all Google Sheets interactions for receipts logging.
 */

// Example defaults
//const APP_DEFAULTS = {
//  SHEET_NAME: "Receipts",
//  LOG_SHEET: "OCR_Log"
//};

const SheetService = (function() {

  /**
   * Get the main receipts sheet. Creates headers if empty.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getReceiptsSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP_DEFAULTS.SHEET_NAME)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(APP_DEFAULTS.SHEET_NAME);

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
        "Human Correction"
      ]);
    }
    return sheet;
  }

  /**
   * Get the sheet where raw OCR text is logged.
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getLogSheet() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(APP_DEFAULTS.LOG_SHEET)
      || SpreadsheetApp.getActiveSpreadsheet().insertSheet(APP_DEFAULTS.LOG_SHEET);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["File Name", "OCR Text", "Logged At"]);
    }
    return sheet;
  }

  /**
   * Append a parsed receipt to the Receipts sheet
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
   * @param {Object} receipt - Parsed receipt data
   */
  function appendReceipt(sheet, receipt) {
    sheet.appendRow([
      receipt.date,
      receipt.fileName,
      receipt.vendor,
      receipt.description,
      receipt.category,
      receipt.amount,
      receipt.confidence,
      receipt.uploader,
      receipt.url,
      receipt.hash,
      receipt.humanCorrection || ""
    ]);
  }

  /**
   * Log full OCR text to the OCR log sheet
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
   * @param {string} fileName 
   * @param {string} ocrText 
   */
  function logOCR(sheet, fileName, ocrText) {
    sheet.appendRow([fileName, ocrText, new Date()]);
  }

  /**
   * Get a set of existing hashes to prevent duplicate processing
   * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet 
   * @returns {Set<string>}
   */
  function getExistingHashes(sheet) {
    const data = sheet.getRange(2, 10, sheet.getLastRow() - 1).getValues(); // column 10 = Hash
    return new Set(data.flat().filter(Boolean));
  }

  return {
    getReceiptsSheet,
    getLogSheet,
    appendReceipt,
    logOCR,
    getExistingHashes
  };

})();