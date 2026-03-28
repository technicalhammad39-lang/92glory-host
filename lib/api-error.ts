import { NextResponse } from 'next/server';

export function apiError(context: string, error: unknown, status = 500) {
  // Keep logs on server for debugging production issues.
  console.error(`[API:${context}]`, error);
  return NextResponse.json(
    {
      error: 'Internal server error',
      context
    },
    { status }
  );
}

