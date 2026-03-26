/**
 * Entry point for processing all inbound receipt files.
 * 
 * Flow:
 * 1. Pull files from inbound folder
 * 2. Process each file via DocumentProcessor
 * 3. Deduplicate using hash
 * 4. Append structured data to sheet
 * 5. Log raw OCR text
 * 6. Move file to processed folder
 */
function processReceipts() {
  LoggerService.info("Starting processing");

  const sheet = SheetService.getReceiptsSheet();
  const logSheet = SheetService.getLogSheet();
  const files = DriveService.getInboundFiles();
  const processedFolder = DriveService.getProcessedFolder();

  // Used to prevent duplicate processing
  const existingHashes = SheetService.getExistingHashes(sheet);

  while (files.hasNext()) {
    const file = files.next();

    try {
      LoggerService.info(`Processing: ${file.getName()}`);

      // Core processing abstraction (OCR + parsing or future Document AI)
      const parsed = DocumentProcessor.process(file);

      if (!parsed) {
        LoggerService.warn("No data extracted");
        continue;
      }

      // Generate unique hash based on OCR text
      parsed.hash = Utils.generateHash(parsed.rawText);
      parsed.fileName = file.getName();
      parsed.url = file.getUrl();

      // Skip duplicates
      if (existingHashes.has(parsed.hash)) {
        LoggerService.warn("Duplicate detected");
        file.moveTo(processedFolder);
        continue;
      }

      // Classify expense category (HOA-specific logic)
      parsed.category = CategoryClassifier.classify(parsed.rawText, parsed.vendor);

      // Write structured data
      SheetService.appendReceipt(sheet, parsed);

      // Log raw OCR for audit/debugging
      SheetService.logOCR(logSheet, parsed.fileName, parsed.rawText);

      // Move file after successful processing
      file.moveTo(processedFolder);

      LoggerService.info(`Done: ${parsed.amount} (${parsed.confidence})`);

    } catch (e) {
      LoggerService.error(e.toString());
    }
  }

  LoggerService.info("Finished processing");
}