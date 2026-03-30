export const TX_MAX_WAIT_MS = Number(process.env.PRISMA_TX_MAX_WAIT_MS || 20_000);
export const TX_TIMEOUT_MS = Number(process.env.PRISMA_TX_TIMEOUT_MS || 30_000);

export const TX_OPTIONS = {
  maxWait: TX_MAX_WAIT_MS,
  timeout: TX_TIMEOUT_MS
};
