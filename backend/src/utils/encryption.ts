/**
 * Encryption Utility Module
 *
 * Provides AES-256-GCM symmetric encryption for securely storing and retrieving
 * user API keys. Uses a server-side master key to encrypt/decrypt keys while
 * maintaining the ability to recover the original plain-text value.
 *
 * Environment Variables Required:
 * - ENCRYPTION_MASTER_KEY: 32-byte (256-bit) encryption key for AES-256
 */

import * as crypto from "crypto";

// Constants
const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes for GCM mode (96 bits)
const AUTH_TAG_LENGTH = 16; // 16 bytes for GCM authentication tag (128 bits)

/**
 * Encrypted data structure
 */
export interface EncryptedData {
  value: string; // Base64-encoded encrypted ciphertext (includes auth tag)
  iv: string; // Base64-encoded initialization vector
}

/**
 * Validate the master encryption key
 * @throws Error if ENCRYPTION_MASTER_KEY is not set or invalid
 */
function validateMasterKey(): Buffer {
  const masterKey = process.env.ENCRYPTION_MASTER_KEY;

  if (!masterKey) {
    throw new Error(
      "ENCRYPTION_MASTER_KEY environment variable is not set. " +
        "Please generate a 32-byte key using: node -e \"console.log(require('crypto').randomBytes(32).toString('base64'))\""
    );
  }

  let keyBuffer: Buffer;

  try {
    // Try to decode as base64 first (recommended format)
    keyBuffer = Buffer.from(masterKey, "base64");
  } catch {
    // Fall back to UTF-8 encoding
    keyBuffer = Buffer.from(masterKey, "utf8");
  }

  // Ensure the key is exactly 32 bytes (256 bits)
  if (keyBuffer.length !== 32) {
    throw new Error(
      `ENCRYPTION_MASTER_KEY must be exactly 32 bytes (256 bits). ` +
        `Current length: ${keyBuffer.length} bytes. ` +
        `Generate a valid key using: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
    );
  }

  return keyBuffer;
}

/**
 * Encrypt a plain-text string using AES-256-GCM
 *
 * @param plainText - The original, plain-text value to encrypt (e.g., API key)
 * @returns EncryptedData object containing the encrypted value and IV
 *
 * @example
 * const encrypted = encryptKey("sk-my-secret-api-key");
 * // Store encrypted.value and encrypted.iv in database
 */
export function encryptKey(plainText: string): EncryptedData {
  try {
    // Validate and get the master key
    const key = validateMasterKey();

    // Generate a unique, random IV for this encryption
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher with AES-256-GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt the plain text
    let encrypted = cipher.update(plainText, "utf8");
    encrypted = Buffer.concat([encrypted, cipher.final()]);

    // Get the authentication tag (GCM mode)
    const authTag = cipher.getAuthTag();

    // Combine encrypted data with auth tag
    const encryptedWithTag = Buffer.concat([encrypted, authTag]);

    // Return base64-encoded values
    return {
      value: encryptedWithTag.toString("base64"),
      iv: iv.toString("base64"),
    };
  } catch (error: any) {
    console.error("Encryption error:", error.message);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 *
 * @param encryptedData - Object containing the encrypted value and IV
 * @returns The original, plain-text string
 *
 * @example
 * const decrypted = decryptKey({ value: "...", iv: "..." });
 * // Use decrypted API key for external requests
 */
export function decryptKey(encryptedData: EncryptedData): string {
  try {
    // Validate input
    if (!encryptedData || !encryptedData.value || !encryptedData.iv) {
      throw new Error(
        "Invalid encrypted data format. Must contain 'value' and 'iv' properties."
      );
    }

    // Validate and get the master key
    const key = validateMasterKey();

    // Decode base64 values
    const encryptedWithTag = Buffer.from(encryptedData.value, "base64");
    const iv = Buffer.from(encryptedData.iv, "base64");

    // Validate IV length
    if (iv.length !== IV_LENGTH) {
      throw new Error(
        `Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length} bytes`
      );
    }

    // Split encrypted data and auth tag
    if (encryptedWithTag.length < AUTH_TAG_LENGTH) {
      throw new Error(
        `Invalid encrypted data: too short (${encryptedWithTag.length} bytes)`
      );
    }

    const authTag = encryptedWithTag.slice(-AUTH_TAG_LENGTH);
    const encrypted = encryptedWithTag.slice(0, -AUTH_TAG_LENGTH);

    // Create decipher with AES-256-GCM
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } catch (error: any) {
    console.error("Decryption error:", error.message);

    // Provide helpful error messages
    if (
      error.message?.includes(
        "Unsupported state or unable to authenticate data"
      )
    ) {
      throw new Error(
        "Failed to decrypt data: Invalid authentication tag. " +
          "This usually means the encryption key has changed or the data has been tampered with."
      );
    }

    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

/**
 * Generate a secure random encryption key
 * This is a utility function for generating the ENCRYPTION_MASTER_KEY
 *
 * @returns Base64-encoded 32-byte encryption key
 *
 * @example
 * const key = generateEncryptionKey();
 * console.log("Set this as your ENCRYPTION_MASTER_KEY:", key);
 */
export function generateEncryptionKey(): string {
  return crypto.randomBytes(32).toString("base64");
}

/**
 * Migrate from old AES-256-CBC encryption format to new AES-256-GCM format
 *
 * This function helps with migrating existing encrypted data from the old format
 * (IV:encrypted stored as single string) to the new format (separate value and IV).
 *
 * @param oldEncrypted - Old format encrypted string (iv:encrypted)
 * @param oldEncryptionKey - The old encryption key (from API_KEY_ENCRYPTION_SECRET)
 * @returns EncryptedData in new format
 */
export function migrateFromOldFormat(
  oldEncrypted: string,
  oldEncryptionKey: string
): EncryptedData {
  try {
    // Old format: "iv:encrypted" using AES-256-CBC
    const parts = oldEncrypted.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid old format: expected 'iv:encrypted'");
    }

    const iv = Buffer.from(parts[0]!, "hex");
    const encryptedText = parts[1]!;
    const key = crypto.scryptSync(oldEncryptionKey, "salt", 32);

    // Decrypt using old method (AES-256-CBC)
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");

    // Re-encrypt using new method (AES-256-GCM)
    return encryptKey(decrypted);
  } catch (error: any) {
    console.error("Migration error:", error.message);
    throw new Error(`Failed to migrate from old format: ${error.message}`);
  }
}

export default {
  encryptKey,
  decryptKey,
  generateEncryptionKey,
  migrateFromOldFormat,
};
