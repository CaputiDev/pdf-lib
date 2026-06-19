import * as crypto from 'crypto';

/**
 * Generates a random 32-byte key represented as a 64-character hex string.
 */
export function generateRandomKeyHex(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypts a buffer using aes-256-cbc with the provided key (in hex format).
 * The 16-byte IV is prepended to the returned encrypted buffer.
 */
export function encryptWithKey(buffer: Buffer, keyHex: string): Buffer {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error(
      'Encryption key must be exactly 32 bytes (64 hex characters).',
    );
  }
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([iv, encrypted]);
}

/**
 * Decrypts a buffer using aes-256-cbc with the provided key (in hex format).
 * Assumes the first 16 bytes of the buffer are the IV.
 */
export function decryptWithKey(buffer: Buffer, keyHex: string): Buffer {
  const key = Buffer.from(keyHex, 'hex');
  if (key.length !== 32) {
    throw new Error(
      'Encryption key must be exactly 32 bytes (64 hex characters).',
    );
  }
  if (buffer.length < 16) {
    throw new Error(
      'Buffer is too short to contain the initialization vector (IV).',
    );
  }
  const iv = buffer.subarray(0, 16);
  const encryptedData = buffer.subarray(16);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encryptedData), decipher.final()]);
}
