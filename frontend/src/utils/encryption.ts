/**
 * Client-side encryption utilities for secure data transmission
 * Uses Web Crypto API for AES-GCM encryption
 */

// Get or generate encryption key from environment
const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

/**
 * Derive a crypto key from the password/secret
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("nutrichef-salt"), // In production, use a proper salt
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt data using AES-GCM
 * Returns base64-encoded encrypted data with IV prepended
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const key = await deriveKey(ENCRYPTION_KEY);

    // Generate a random IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encoder.encode(plaintext)
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    // Convert to base64 for transmission
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
}

/**
 * Decrypt data using AES-GCM
 * Accepts base64-encoded encrypted data with IV prepended
 */
export async function decryptData(encryptedBase64: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    const key = await deriveKey(ENCRYPTION_KEY);

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedBase64), (c) =>
      c.charCodeAt(0)
    );

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      key,
      encryptedData
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Hash data using SHA-256 (for verification, not encryption)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
