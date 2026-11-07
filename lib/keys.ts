import { createHash, randomBytes } from "crypto";

export function newApiKey() {
  const token = `omni_${randomBytes(24).toString("base64url")}`;
  return {
    token,
    hash: hashApiKey(token),
    prefix: token.slice(0, 12),
  };
}

export function hashApiKey(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
