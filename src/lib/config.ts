import "server-only";

export const isProduction = process.env.NODE_ENV === "production";

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3100").replace(/\/$/, "");
}

export function sessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("SESSION_SECRET is missing or too short. Set it in .env.");
  }
  return secret;
}

function intEnv(name: string, fallback: number) {
  const n = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export const downloadPolicy = {
  get expiryDays() {
    return intEnv("DOWNLOAD_EXPIRY_DAYS", 30);
  },
  get limit() {
    return intEnv("DOWNLOAD_LIMIT", 5);
  },
};

export type PaymentMode = "razorpay" | "demo" | "unconfigured";

/**
 * "razorpay" when keys are set. Without keys, local development gets a demo
 * payment screen; a production build refuses to take orders instead, so a
 * missing key can never hand out paid files for free.
 */
export function paymentMode(): PaymentMode {
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) return "razorpay";
  return isProduction ? "unconfigured" : "demo";
}

export function emailDeliveryEnabled() {
  return Boolean(process.env.SMTP_HOST);
}
