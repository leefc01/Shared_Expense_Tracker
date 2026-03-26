/**
 * Main entry point for processing inbound receipt files.
 */
function processReceipts() {
  LoggerService.info("Starting processing");

  const sheet = SheetService.getReceiptsSheet();
  const logSheet = SheetService.getLogSheet();
  const files = DriveService.getInboundFiles();
  const processedFolder = DriveService.getProcessedFolder();

  const existingHashes = SheetService.getExistingHashes(sheet);

  while (files.hasNext()) {
    const file = files.next();
    try {
      LoggerService.info(`Processing: ${file.getName()}`);

      const parsed = DocumentProcessor.process(file);
      if(!parsed){ LoggerService.warn("No data extracted"); continue; }

      if(existingHashes.has(parsed.hash)) {
        LoggerService.warn("Duplicate detected"); file.moveTo(processedFolder); continue;
      }

      SheetService.appendReceipt(sheet, parsed);
      SheetService.logOCR(logSheet, parsed.fileName, parsed.rawText);
      file.moveTo(processedFolder);
      LoggerService.info(`Done: ${parsed.amount} (${parsed.confidence})`);
    } catch(e){ LoggerService.error(e.toString()); }
  }

  LoggerService.info("Finished processing");
}