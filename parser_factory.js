const ParserFactory = {
  getParser() {
    switch (CONFIG.PARSER_TYPE) {
      case "VISION":
        return VisionParser;
      case "DOCUMENT_AI":
        return DocumentAIParser; // future
      default:
        throw new Error("Unknown parser type");
    }
  }
};