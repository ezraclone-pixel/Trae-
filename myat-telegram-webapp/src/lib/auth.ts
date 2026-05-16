import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "mw_session";
const ADMIN_COOKIE = "mw_admin";

function getSecret() {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret) throw new Error("APP_JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function setUserSession(telegramId: string) {
  const token = await new SignJWT({ telegramId, typ: "user" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());

  const jar = await cookies();
  
  // 🚀 Vercel + Telegram Mini App (iframe) အတွက် အကောင်းဆုံး Cookie Configuration
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "none", // <iframe> ထဲကနေ Cookie ပေးပို့ခွင့်ပြုရန်
    secure: true,     // sameSite: "none" သုံးရင် secure က true မဖြစ်မနေ ဖြစ်ရပါမယ်
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearUserSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { 
    path: "/", 
    maxAge: 0,
    sameSite: "none",
    secure: true 
  });
}

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "user") return null;
    return String(payload.telegramId);
  } catch {
    return null;
  }
}

export async function setAdminSession() {
  const token = await new SignJWT({ typ: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "none",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, "", { 
    path: "/", 
    maxAge: 0,
    sameSite: "none",
    secure: true 
  });
}

export async function isAdminRequest(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload.typ === "admin";
  } catch {
    return false;
  }
    }
    
