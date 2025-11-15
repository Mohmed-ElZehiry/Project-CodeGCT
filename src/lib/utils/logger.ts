type LogMeta = Record<string, unknown>;

function stamp() {
  const d = new Date();
  const iso = d.toISOString();
  const time = iso.slice(11, 19);
  return `${iso.slice(0, 10)} ${time}`;
}

function format(message: string, meta?: LogMeta) {
  if (!meta || Object.keys(meta).length === 0) return message;
  return `${message} | ${JSON.stringify(meta)}`;
}

export function logInfo(message: string, meta?: LogMeta) {
  console.log(`\x1b[34m[INFO]\x1b[0m ${stamp()} — ${format(message, meta)}`);
}

export function logWarn(message: string, meta?: LogMeta) {
  console.warn(`\x1b[33m[WARN]\x1b[0m ${stamp()} — ${format(message, meta)}`);
}

export function logError(message: string, meta?: LogMeta) {
  console.error(`\x1b[31m[ERROR]\x1b[0m ${stamp()} — ${format(message, meta)}`);
}

// ✅ إضافة debug للـ Analyzer
export function logDebug(message: string, meta?: LogMeta) {
  console.debug(`\x1b[36m[DEBUG]\x1b[0m ${stamp()} — ${format(message, meta)}`);
}

const logger = { logInfo, logWarn, logError, logDebug };

export default logger;
