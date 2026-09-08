export async function encryptMessage(text: string, password?: string): Promise<{ encryptedMessage: string, secretKey: string, iv: string, salt: string | null }> {
  const enc = new TextEncoder();
  const secretKeyBytes = window.crypto.getRandomValues(new Uint8Array(32));
  const secretKey = bytesToBase64Url(secretKeyBytes);

  const ivBytes = window.crypto.getRandomValues(new Uint8Array(12));
  const iv = bytesToBase64Url(ivBytes);
  let saltBytes: Uint8Array | null = null;
  let salt: string | null = null;

  let key: CryptoKey;

  if (password) {
    saltBytes = window.crypto.getRandomValues(new Uint8Array(16));
    salt = bytesToBase64Url(saltBytes);

    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password + secretKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );
  } else {
    key = await window.crypto.subtle.importKey(
      "raw",
      secretKeyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"]
    );
  }

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    enc.encode(text)
  );

  const encryptedMessage = bytesToBase64Url(new Uint8Array(encryptedBuffer));

  return { encryptedMessage, secretKey, iv, salt };
}

export async function decryptMessage(encryptedMessage: string, secretKey: string, iv: string, salt?: string | null, password?: string): Promise<string> {
  const dec = new TextDecoder();
  const encryptedBytes = base64UrlToBytes(encryptedMessage);
  const ivBytes = base64UrlToBytes(iv);
  const secretKeyBytes = base64UrlToBytes(secretKey);

  let key: CryptoKey;

  if (salt && password) {
    const saltBytes = base64UrlToBytes(salt);
    const enc = new TextEncoder();
    const baseKey = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password + secretKey),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );

    key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: saltBytes,
        iterations: 100000,
        hash: "SHA-256"
      },
      baseKey,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
  } else {
    key = await window.crypto.subtle.importKey(
      "raw",
      secretKeyBytes,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    encryptedBytes
  );

  return dec.decode(decryptedBuffer);
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', enc.encode(password));
  return bytesToBase64Url(new Uint8Array(hashBuffer));
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binString).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(base64url: string): Uint8Array {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binString = atob(base64);
  return Uint8Array.from(binString, (m) => m.codePointAt(0)!);
}
