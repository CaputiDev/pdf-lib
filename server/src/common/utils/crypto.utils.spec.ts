import {
  generateRandomKeyHex,
  encryptWithKey,
  decryptWithKey,
} from './crypto.utils';

describe('CryptoUtils', () => {
  it('should generate a 64-character hex key', () => {
    const key = generateRandomKeyHex();
    expect(key).toHaveLength(64);
    expect(/^[0-9a-fA-F]{64}$/.test(key)).toBe(true);
  });

  it('should encrypt and decrypt a buffer correctly', () => {
    const key = generateRandomKeyHex();
    const data = Buffer.from('Testing encryption and decryption workflow!');

    const encrypted = encryptWithKey(data, key);
    expect(encrypted.length).toBeGreaterThan(16); // IV (16) + cipher block

    const decrypted = decryptWithKey(encrypted, key);
    expect(decrypted.toString()).toBe(
      'Testing encryption and decryption workflow!',
    );
  });

  it('should fail decryption with a wrong key', () => {
    const key1 = generateRandomKeyHex();
    const key2 = generateRandomKeyHex();
    const data = Buffer.from('Secret messages');

    const encrypted = encryptWithKey(data, key1);

    expect(() => decryptWithKey(encrypted, key2)).toThrow();
  });

  it('should throw if key is not 32 bytes (64 hex characters)', () => {
    const invalidKey = 'too-short';
    const data = Buffer.from('hello');

    expect(() => encryptWithKey(data, invalidKey)).toThrow(
      'Encryption key must be exactly 32 bytes (64 hex characters).',
    );
    expect(() => decryptWithKey(Buffer.alloc(20), invalidKey)).toThrow(
      'Encryption key must be exactly 32 bytes (64 hex characters).',
    );
  });

  it('should throw if buffer is too short to contain IV', () => {
    const key = generateRandomKeyHex();
    const shortBuffer = Buffer.alloc(10); // Less than 16 bytes

    expect(() => decryptWithKey(shortBuffer, key)).toThrow(
      'Buffer is too short to contain the initialization vector (IV).',
    );
  });
});
