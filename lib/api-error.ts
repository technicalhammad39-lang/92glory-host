import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { databaseConfigError, isDatabaseConfigured } from '@/lib/db';

type ApiErrorResponse = {
  error: string;
  context: string;
  code?: string;
};

function jsonError(status: number, payload: ApiErrorResponse) {
  return NextResponse.json(payload, { status });
}

export function serviceUnavailable(context: string, message = 'Service temporarily unavailable') {
  return jsonError(503, {
    error: message,
    context,
    code: 'SERVICE_UNAVAILABLE'
  });
}

export function apiError(context: string, error: unknown, fallbackStatus = 500) {
  if (!isDatabaseConfigured) {
    return serviceUnavailable(context, databaseConfigError || 'Database configuration is invalid.');
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(`[API:${context}] Prisma initialization error`, error.message);
    return serviceUnavailable(context, 'Database connection failed.');
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error(`[API:${context}] Prisma known error ${error.code}`, error.message);

    if (error.code === 'P2002') {
      return jsonError(409, {
        error: 'Duplicate value violates a unique field.',
        context,
        code: error.code
      });
    }

    if (error.code === 'P2025') {
      return jsonError(404, {
        error: 'Requested record was not found.',
        context,
        code: error.code
      });
    }

    if (error.code === 'P2003') {
      return jsonError(400, {
        error: 'Invalid relation reference.',
        context,
        code: error.code
      });
    }
  }

  if (error instanceof Error) {
    console.error(`[API:${context}]`, error.message);
  } else {
    console.error(`[API:${context}]`, error);
  }

  return jsonError(fallbackStatus, {
    error: 'Internal server error',
    context,
    code: 'INTERNAL_ERROR'
  });
}
