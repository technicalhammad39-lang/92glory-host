const jwt = require('jsonwebtoken') as {
  sign: (payload: object, secret: string, options: { expiresIn: string }) => string;
  verify: (token: string, secret: string) => unknown;
};

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
