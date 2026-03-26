/**
 * LoggerService
 * 
 * Lightweight logging utility with configurable levels.
 * 
 * Levels:
 * 0 = NONE
 * 1 = ERROR
 * 2 = WARN
 * 3 = INFO
 * 
 * Usage:
 * LoggerService.info("message");
 * LoggerService.warn("message");
 * LoggerService.error("message");
 */
const LoggerService = {
  LEVEL: 3,

  info(msg) {
    if (this.LEVEL >= 3) console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  },

  warn(msg) {
    if (this.LEVEL >= 2) console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  },

  error(msg) {
    if (this.LEVEL >= 1) console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  }
};