const VisionService = {
  extractText(file) {
    LoggerService.debug("Calling Vision API");

    const base64 = Utilities.base64Encode(file.getBlob().getBytes());

    const response = UrlFetchApp.fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${CONFIG.VISION_API_KEY}`,
      {
        method: "POST",
        contentType: "application/json",
        payload: JSON.stringify({
          requests: [{
            image: { content: base64 },
            features: [{ type: "DOCUMENT_TEXT_DETECTION" }]
          }]
        }),
        muteHttpExceptions: true
      }
    );

    if (response.getResponseCode() !== 200) {
      throw new Error("Vision API failed");
    }

    const result = JSON.parse(response.getContentText());
    return result?.responses?.[0]?.fullTextAnnotation?.text || null;
  }
};
