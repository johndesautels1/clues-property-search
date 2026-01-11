const level = (process.env.PIPELINE_LOG_LEVEL ?? "info").toLowerCase();
const order = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type L = keyof typeof order;

function ok(l: L) {
  return order[l] >= (order[level as L] ?? 20);
}

export const log = {
  debug: (...args: any[]) => ok("debug") && console.debug("[debug]", ...args),
  info:  (...args: any[]) => ok("info")  && console.info("[info]", ...args),
  warn:  (...args: any[]) => ok("warn")  && console.warn("[warn]", ...args),
  error: (...args: any[]) => ok("error") && console.error("[error]", ...args),
};
