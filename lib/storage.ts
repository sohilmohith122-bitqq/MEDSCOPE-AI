import { promises as fs } from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";

/**
 * Storage root.
 * - `STORAGE_DIR` wins when set (use a mounted volume / writable path).
 * - On Vercel the deployment filesystem is read-only except `/tmp`, so fall back
 *   to a temporary directory (ephemeral: originals are lost after the instance
 *   recycles — fine for the synthetic demo, see README limitations).
 * - Locally keeps the original `<repo>/storage/documents` location.
 */
export function storageDir() {
  if (process.env.STORAGE_DIR) return process.env.STORAGE_DIR;
  if (process.env.VERCEL) return path.join(os.tmpdir(), "medcare-storage", "documents");
  return path.join(process.cwd(), "storage", "documents");
}
export async function saveOriginal(bytes: Buffer, key: string) {
  const dir = storageDir();
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, key), bytes);
}
export async function readOriginal(key: string): Promise<Buffer> {
  const full = path.join(storageDir(), path.basename(key));
  return fs.readFile(full);
}
export function sha256(bytes: Buffer) { return crypto.createHash("sha256").update(bytes).digest("hex"); }
export function signToken(payload: string) {
  const secret = process.env.SHARE_TOKEN_SECRET ?? "dev-only-change-me-32-chars-minimum";
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}