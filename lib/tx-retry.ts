import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { TX_OPTIONS } from '@/lib/tx-options';

function isRetryableTxError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  return error.code === 'P2028' || error.code === 'P2034' || error.code === 'P1017';
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withTxRetry<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>,
  retries: number = 1
) {
  let attempt = 0;
  while (true) {
    try {
      return await db.$transaction(operation, TX_OPTIONS);
    } catch (error) {
      if (!isRetryableTxError(error) || attempt >= retries) {
        throw error;
      }
      attempt += 1;
      await sleep(120 * attempt);
    }
  }
}
