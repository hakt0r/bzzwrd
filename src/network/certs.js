import { generateKeyPairSync, createPrivateKey, createPublicKey } from "crypto";
import { writeFileSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { info, success } from '../colors.js';

const CERT_DIR = join(process.cwd(), "certs");
const CERT_PATH = join(CERT_DIR, "cert.pem");
const KEY_PATH = join(CERT_DIR, "key.pem");

export function ensureCertificates() {
  // Create certs directory if it doesn't exist
  if (!existsSync(CERT_DIR)) {
    console.log(`${info} Creating certificates directory...`);
    require("fs").mkdirSync(CERT_DIR, { recursive: true });
  }

  // Check if certificates already exist
  if (existsSync(CERT_PATH) && existsSync(KEY_PATH)) {
    console.log(`${info} Using existing certificates...`);
    return {
      cert: readFileSync(CERT_PATH),
      key: readFileSync(KEY_PATH)
    };
  }

  console.log(`${info} Generating new certificates...`);

  // Generate key pair
  const { publicKey, privateKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: "spki",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs8",
      format: "pem"
    }
  });

  // Save certificates
  writeFileSync(CERT_PATH, publicKey);
  writeFileSync(KEY_PATH, privateKey);

  return {
    cert: publicKey,
    key: privateKey
  };
} 