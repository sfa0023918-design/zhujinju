import { createHmac, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "zhujinju_admin_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

type AdminCredentials = {
  email: string;
  password: string;
  secret: string;
};

function getAdminCredentials(): AdminCredentials | null {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !password || !secret) {
    if (process.env.NODE_ENV !== "production") {
      return {
        email: "admin@zhujinju.com",
        password: "zhujinju-admin-2026",
        secret: "zhujinju-dev-session-secret",
      };
    }

    return null;
  }

  return { email, password, secret };
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function encodeSession(email: string, secret: string) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payload = `${email}:${expiresAt}`;
  const signature = sign(payload, secret);

  return Buffer.from(JSON.stringify({ email, expiresAt, signature }), "utf8").toString("base64url");
}

function decodeSession(token: string, secret: string) {
  try {
    const raw = Buffer.from(token, "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as {
      email: string;
      expiresAt: number;
      signature: string;
    };

    const payload = `${parsed.email}:${parsed.expiresAt}`;
    const expected = sign(payload, secret);
    const valid = timingSafeEqual(
      Buffer.from(parsed.signature, "utf8"),
      Buffer.from(expected, "utf8"),
    );

    if (!valid || parsed.expiresAt < Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function isAdminConfigured() {
  return Boolean(getAdminCredentials());
}

export async function verifyAdminLogin(email: string, password: string) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = credentials.email.toLowerCase();

  if (normalizedEmail.length !== expectedEmail.length || password.length !== credentials.password.length) {
    return false;
  }

  const emailMatches = timingSafeEqual(Buffer.from(normalizedEmail, "utf8"), Buffer.from(expectedEmail, "utf8"));
  const passwordMatches = timingSafeEqual(Buffer.from(password, "utf8"), Buffer.from(credentials.password, "utf8"));

  return emailMatches && passwordMatches;
}

export async function createAdminSession(email: string) {
  const credentials = getAdminCredentials();

  if (!credentials) {
    throw new Error("后台未配置管理员账号。");
  }

  const token = encodeSession(email, credentials.secret);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getAdminSession() {
  const credentials = getAdminCredentials();

  if (!credentials) {
    return null;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  return decodeSession(token, credentials.secret);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
