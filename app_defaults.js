/**
 * APP_DEFAULTS
 * Centralized configuration and parsing constants for maintainability.
 */
const APP_DEFAULTS = {
  // --- Sheet Names ---
  SHEET_NAME: "Receipts",
  LOG_SHEET: "OCR_Log",

  // --- Processing Modes ---
  OCR_MODE: "VISION",          // "VISION" or "DRIVE"
  ML_MODE: "OFF",              // "ON" or "OFF"
  PROCESSOR_MODE: "OCR_RULE",  // "OCR_RULE" or "DOCUMENT_AI"

  // --- Keywords for Parsing ---
  AMOUNT_KEYWORDS: ["total", "amount due", "balance"],
  SUBTRACT_KEYWORDS: ["subtotal", "tax", "tip"],
  DATE_KEYWORDS: ["transaction date", "service date", "date of service", "date"],
  DESCRIPTION_KEYWORDS: ["description", "note"],

  // --- Confidence Defaults ---
  CONFIDENCE_BASE: 50,
  CONFIDENCE_BOOST: 20,       // Boost for keywords like "total" or "amount due"
  CONFIDENCE_MAX: 100,

  // --- Folder Defaults ---
  DEFAULT_INBOUND_FOLDER: "Inbound Receipts",
  DEFAULT_PROCESSED_FOLDER: "Processed Receipts",
  DEFAULT_LOG_FOLDER: "Logs",

  // --- File Type Handling ---
  DOCUMENT_MIMES: [
    "application/vnd.google-apps.document",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  IMAGE_MIMES: ["image/png", "image/jpeg", "image/jpg"],
  PDF_MIME: "application/pdf"
};