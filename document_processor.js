/**
 * @file document_processor.gs
 * @description
 * Central orchestrator for file processing.
 * Handles multiple modes:
 *  - OCR_RULE: rule-based parsing with OCR
 *  - DOCUMENT_AI: (future) structured Document AI parsing
 * Also provides ML_MODE toggle for future ML-based parsing.
 */
/**
 * NOTE: DOCUMENT_AI and ML_MODE are not yet implemented.
 * Currently only supports OCR_RULE using Vision OCR + RuleBasedParser.
 * Future updates can enable these modes without changing the main orchestrator.
 */
/**
 * @typedef {Object} ProcessorOptions
 * @property {string} mode - Processing mode, e.g., "OCR_RULE" or "DOCUMENT_AI"
 * @property {string} mlMode - ML toggle, "ON" or "OFF"
 */

/**
 * DocumentProcessor
 * Provides a unified interface to process files and return structured receipts.
 */
const DocumentProcessor = {
  
  /**
   * Process a single file and return a ParsedReceipt object.
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {ParsedReceipt|null} Parsed structured receipt or null if extraction failed
   */
  process(file) {
    const options = {
      mode: PropertiesService.getScriptProperties().getProperty("PROCESSOR_MODE") || "OCR_RULE",
      mlMode: PropertiesService.getScriptProperties().getProperty("ML_MODE") || "OFF"
    };

    LoggerService.info(`Processor Mode: ${options.mode}, ML Mode: ${options.mlMode}`);

    // Future Document AI integration
    if (options.mode === "DOCUMENT_AI") {
      LoggerService.warn("Document AI selected but not implemented");
      return null;
    }

    // Default path: OCR + rule-based parser
    const text = OCRService.extractText(file);
    if (!text) {
      LoggerService.warn("No text extracted from file");
      return null;
    }

    // Parse text into structured receipt
    const parsed = VisionParser.parseFromText(text, file);

    // Placeholder for future ML enhancement
    if (options.mlMode === "ON") {
      LoggerService.warn("ML mode enabled but not implemented");
    }

    return parsed;
  }
};