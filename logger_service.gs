// logger_service.gs
const LoggerService = {
  LEVEL: 3, // 0=NONE, 1=ERROR, 2=WARN, 3=INFO

  info(msg) {
    if (this.LEVEL >= 3) console.log(`[INFO] ${new Date().toISOString()} - ${msg}`);
  },

  warn(msg) {
    if (this.LEVEL >= 2) console.warn(`[WARN] ${new Date().toISOString()} - ${msg}`);
  },

  error(msg) {
    if (this.LEVEL >= 1) console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`);
  },

  setLevel(level) {
    if ([0, 1, 2, 3].includes(level)) this.LEVEL = level;
  }
};
