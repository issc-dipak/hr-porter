import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.BANK_ENCRYPTION_KEY || 'default-bank-encryption-key-for-hr-portal-2026';
const ALGORITHM = 'aes-256-cbc';

function getDerivedKey(): Buffer {
  // Derive a 32-byte key from the configured key using SHA-256
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
}

/**
 * Encrypt plain text using AES-256-CBC.
 * Returns iv:ciphertext format.
 */
export function encryptText(text: string): string {
  if (!text) return '';
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt AES-256-CBC encrypted text.
 * Handles legacy unencrypted values gracefully.
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.includes(':')) {
    // Return plaintext if it is not in the encrypted format
    return encryptedText;
  }
  try {
    const key = getDerivedKey();
    const parts = encryptedText.split(':');
    const iv = Buffer.from(parts.shift() || '', 'hex');
    const encryptedTextPart = parts.join(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedTextPart, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Decryption failed, returning empty string:', err);
    return '';
  }
}
