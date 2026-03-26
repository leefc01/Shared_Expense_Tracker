/**
 * LoggerService
 * Lightweight, configurable logging with optional Sheet logging.
 * Supports LEVEL override and audit logging to a dedicated sheet.
 */
const LoggerService = (function() {
  // Cache properties for performance
  const props = PropertiesService.getScriptProperties();
  const LEVEL = parseInt(props.getProperty("LOGGER_LEVEL")) || 3; // default INFO
  const SHEET_LOG_ENABLED = (props.getProperty("LOGGER_SHEET_ENABLED") || "OFF") === "ON";
  let logSheetCache = null;

  function getLogSheet() {
    if (!logSheetCache && SHEET_LOG_ENABLED) {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      logSheetCache = ss.getSheetByName(APP_DEFAULTS.LOG_SHEET)
        || ss.insertSheet(APP_DEFAULTS.LOG_SHEET);
      if (logSheetCache.getLastRow() === 0) {
        logSheetCache.appendRow(["Timestamp", "Level", "Message"]);
      }
    }
    return logSheetCache;
  }

  function log(levelName, msg) {
    const ts = new Date().toISOString();
    console.log(`[${levelName}] ${ts} - ${msg}`);
    if (SHEET_LOG_ENABLED) {
      const sheet = getLogSheet();
      if (sheet) sheet.appendRow([ts, levelName, msg]);
    }
  }

  return {
    info(msg) { if (LEVEL >= 3) log("INFO", msg); },
    warn(msg) { if (LEVEL >= 2) log("WARN", msg); },
    error(msg) { if (LEVEL >= 1) log("ERROR", msg); }
  };
})();