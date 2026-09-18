import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
export function storageDir() { return path.join(process.cwd(), "storage", "documents"); }
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