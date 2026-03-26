/**
 * VisionService
 * Wraps Google Vision API document text detection.
 */
const VisionService = {
  extractText(file) {
    const apiKey = PropertiesService.getScriptProperties().getProperty("VISION_API_KEY");
    if (!apiKey) { LoggerService.error("VISION_API_KEY not set"); return null; }
    const mime = file.getMimeType();
    if (!mime.includes("image") && mime!==APP_DEFAULTS.PDF_MIME)
      LoggerService.warn("File may not be supported by Vision OCR: " + mime);

    try {
      LoggerService.info(`Sending file "${file.getName()}" to Vision API`);
      const base64Image = Utilities.base64Encode(file.getBlob().getBytes());
      const payload = { requests:[{image:{content:base64Image},features:[{type:"DOCUMENT_TEXT_DETECTION"}]}] };
      const options = { method:"POST", contentType:"application/json", payload:JSON.stringify(payload), muteHttpExceptions:true };
      const response = UrlFetchApp.fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, options);
      const result = JSON.parse(response.getContentText());
      if(result.error){ LoggerService.error(JSON.stringify(result.error)); return null; }
      const annotation = result.responses?.[0]?.fullTextAnnotation;
      if(annotation?.text){ LoggerService.info(`Vision API extracted ${annotation.text.length} chars`); return annotation.text; }
      LoggerService.warn("Vision API returned no text"); return null;
    } catch(e){ LoggerService.error("Vision API failed: "+e.toString()); return null; }
  }
};