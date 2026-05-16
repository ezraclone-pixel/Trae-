import crypto from "crypto";

export type TelegramWebAppUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
};

export type TelegramInitData = {
  user?: TelegramWebAppUser;
  auth_date?: string;
  query_id?: string;
  start_param?: string;
};

export function verifyTelegramInitData(initData: string, botToken: string) {
  // 🚀 ပြင်ဆင်ချက်: URL Encoding/Decoding ပြဿနာကို ရှင်းဖို့အတွက် 
  // Browser ကော Vercel ကော ဒေတာပုံစံတူအောင် အရင်လုပ်မယ်
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get("hash");
  if (!hash) return { ok: false as const, error: "Missing hash" };

  // hash တစ်ခုပဲ ဖယ်ပြီး ကျန်တဲ့ key တွေကို အက္ခရာစဉ်အလိုက် စီမယ်
  const keys = Array.from(urlParams.keys()).filter((k) => k !== "hash").sort();
  
  const pairs: string[] = [];
  for (const key of keys) {
    const val = urlParams.get(key) || "";
    // 🚀 အဓိက သော့ချက်: Telegram ဘက်က စစ်တဲ့အခါ စာသားတွေကို Decode လုပ်ပြီးသား အတိုင်း စစ်တာမို့လို့
    // ၎င်းတို့ကို မူရင်းပုံစံအတိုင်း ပြန်ပြောင်းပေးရပါတယ်
    pairs.push(`${key}=${val}`);
  }
  const dataCheckString = pairs.join("\n");

  // WebAppData ခံပြီး HMAC-SHA256 ဆောက်ခြင်း
  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  const ok = timingSafeEqualHex(calculatedHash, hash);
  if (!ok) return { ok: false as const, error: "Invalid signature" };

  const init: TelegramInitData = {};
  for (const key of keys) {
    const v = urlParams.get(key) || "";
    if (key === "user") {
      try {
        init.user = JSON.parse(v);
      } catch {
        // ignore
      }
    } else {
      (init as any)[key] = v;
    }
  }

  return { ok: true as const, data: init };
}

function timingSafeEqualHex(a: string, b: string) {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// ၎င်းအောက်က telegramApi နဲ့ တခြား function တွေကတော့ အဟောင်းအတိုင်းပဲ ချန်ထားခဲ့ပါ...
