/**
 * @file ocr_service.gs
 * @description
 * Service layer for OCR extraction.
 * Automatically selects the correct OCR / parser based on file type:
 *  - Vision API for images/PDFs
 *  - Drive OCR for Google Docs / Word
 *  - Native text for plain text / CSV / Markdown
 * Includes logging for debugging and tracing.
 */

const OCRService = {

  /**
   * Extract text from a file based on file type and OCR_MODE.
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {string|null} Extracted text, or null if extraction failed
   */
  extractText(file) {
    const mode = PropertiesService.getScriptProperties().getProperty("OCR_MODE") || "VISION";
    const mime = file.getMimeType();

    LoggerService.info(`File type: ${mime}, OCR_MODE: ${mode}`);

    // --- Document files ---
    if (mime === "application/vnd.google-apps.document" ||
        mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      LoggerService.info("Using Drive OCR for document file");
      const text = this.extractWithDrive(file);
      if (!text) LoggerService.warn("Drive OCR failed for document");
      return text;
    }

    // --- Plain text files ---
    if (mime.startsWith("text/")) {
      LoggerService.info("Using native text parser");
      try {
        return file.getBlob().getDataAsString();
      } catch (e) {
        LoggerService.error("Failed to read text file: " + e.toString());
        return null;
      }
    }

    // --- Images and PDFs ---
    if (mime.includes("image") || mime === "application/pdf") {
      if (mode === "DRIVE") {
        LoggerService.info("Using Drive OCR for image/pdf");
        const text = this.extractWithDrive(file);
        if (text) return text;
        LoggerService.warn("Drive OCR failed, falling back to Vision");
      }
      LoggerService.info("Using Vision OCR for image/pdf");
      return this.extractWithVision(file);
    }

    LoggerService.warn("Unsupported file type: " + mime);
    return null;
  },

  /**
   * Extract text using Google Vision API
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {string|null} Extracted text or null
   */
  extractWithVision(file) {
    return VisionService.extractText(file);
  },

  /**
   * Extract text using Google Drive OCR via temporary Google Doc
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {string|null} Extracted text
   */
  extractWithDrive(file) {
    try {
      const resource = {
        title: "temp_ocr_" + new Date().getTime(),
        mimeType: "application/vnd.google-apps.document"
      };

      // Convert file to Google Doc for OCR
      const temp = Drive.Files.copy(resource, file.getId());
      const text = DocumentApp.openById(temp.id).getBody().getText();

      // Cleanup temporary doc
      Drive.Files.remove(temp.id);
      return text;

    } catch (e) {
      LoggerService.error("Drive OCR failed: " + e.toString());
      return null;
    }
  }
};