import { JWTPayload } from "@/lib/auth-types";

function base64UrlDecode(segment: string): string {
  const normalized = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, "=");

  if (typeof atob !== "undefined") {
    return atob(padded);
  }

  // Fallback for environments without atob (e.g., Node during SSR)
  return Buffer.from(padded, "base64").toString("utf-8");
}

export function decodeJwtPayload(token: string): JWTPayload | null {
  try {
    const [, payloadSegment] = token.split(".");
    if (!payloadSegment) return null;

    const payloadString = base64UrlDecode(payloadSegment);
    const payload = JSON.parse(payloadString) as JWTPayload;
    return payload;
  } catch (error) {
    console.warn("[TOKEN UTILS] Failed to decode JWT payload:", error);
    return null;
  }
}

export function isJwtExpired(payload: { exp?: number } | null, skewSeconds = 0): boolean {
  if (!payload || !payload.exp) return true;
  const expirationMs = payload.exp * 1000;
  const nowWithSkew = Date.now() + skewSeconds * 1000;
  return expirationMs <= nowWithSkew;
}
