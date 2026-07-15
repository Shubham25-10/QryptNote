import CryptoJS from 'crypto-js';

export function encryptMessage(text: string): { encryptedMessage: string, secretKey: string } {
  // Generate a random 256-bit key
  const secretKey = CryptoJS.lib.WordArray.random(32).toString(CryptoJS.enc.Hex);
  const encryptedMessage = CryptoJS.AES.encrypt(text, secretKey).toString();
  return { encryptedMessage, secretKey };
}

export function decryptMessage(encryptedMessage: string, secretKey: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}

export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}
