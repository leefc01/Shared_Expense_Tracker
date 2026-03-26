/**
 * @file vision_service.gs
 * @description
 * Handles OCR text extraction via Google Vision API.
 * Requires VISION_API_KEY to be set in Script Properties.
 * Adds detailed logging and file type checks to aid debugging.
 */

/**
 * VisionService
 * Provides a wrapper for Google Vision API document text detection.
 */
const VisionService = {

  /**
   * Extract text from an image or PDF using Vision API.
   * Logs raw response for debugging.
   * @param {GoogleAppsScript.Drive.File} file
   * @returns {string|null} Extracted OCR text or null if failed
   */
  extractText(file) {
    const apiKey = PropertiesService.getScriptProperties().getProperty("VISION_API_KEY");
    if (!apiKey) {
      LoggerService.error("VISION_API_KEY not set in Script Properties");
      return null;
    }

    // File type check
    const mime = file.getMimeType();
    if (!mime.includes("image") && mime !== "application/pdf") {
      LoggerService.warn(`File type may not be supported by Vision OCR: ${mime}`);
    }

    try {
      LoggerService.info(`Sending file "${file.getName()}" to Vision API`);

      const base64Image = Utilities.base64Encode(file.getBlob().getBytes());
      const payload = {
        requests: [{
          image: { content: base64Image },
          features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
        }]
      };

      const options = {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, 
        options
      );

      const resultText = response.getContentText();
      LoggerService.info(`Vision API raw response: ${resultText}`);

      const result = JSON.parse(resultText);

      if (result.error) {
        LoggerService.error(`Vision API returned error: ${JSON.stringify(result.error)}`);
        return null;
      }

      const annotation = result.responses?.[0]?.fullTextAnnotation;
      if (annotation && annotation.text) {
        LoggerService.info(`Vision API extracted ${annotation.text.length} characters`);
        return annotation.text;
      }

      LoggerService.warn("Vision API returned no text");
      return null;

    } catch (e) {
      LoggerService.error("Vision API extraction failed: " + e.toString());
      return null;
    }
  }
};