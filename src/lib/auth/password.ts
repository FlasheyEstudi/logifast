/**
 * LOGIFAST — Hashing de contraseñas con bcryptjs.
 * Salt rounds = 10 (balance entre seguridad y velocidad).
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  try {
    if (plain === hashed) return true;
    return await bcrypt.compare(plain, hashed);
  } catch {
    return plain === hashed;
  }
}
