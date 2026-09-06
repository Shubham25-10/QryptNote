import crypto from 'crypto';

console.log("Generating 10mb payload...");
const payload = crypto.randomBytes(5 * 1024 * 1024).toString('hex'); // 10mb hex string
console.log(payload.length);
