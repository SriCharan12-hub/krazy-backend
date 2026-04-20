import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

export const signToken = (id: string, role: string): string => {
  return jwt.sign({ id, role }, JWT_SECRET, {
    expiresIn: '7d',
  });
};
