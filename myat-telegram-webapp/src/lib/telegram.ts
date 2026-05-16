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
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false as const, error: "Missing hash" };

  params.delete("hash");

  const pairs: string[] = [];
  params.sort();
  for (const [key, value] of params.entries()) {
    pairs.push(`${key}=${value}`);
  }
  const dataCheckString = pairs.join("\n");

  // 🚀 အဓိက ပြင်လိုက်တဲ့နေရာ: Telegram စံနှုန်းအတိုင်း WebAppData ကို ခံပြီး HMAC-SHA256 နဲ့ စနစ်တကျ ပြန်ဆောက်ထားပါတယ်
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
  for (const [k, v] of params.entries()) {
    if (k === "user") {
      try {
        init.user = JSON.parse(v);
      } catch {
        // ignore
      }
    } else {
      (init as any)[k] = v;
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

export async function telegramApi<T>(
  method: string,
  body: Record<string, any>,
  botToken: string,
): Promise<T> {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = await res.json();
  if (!json?.ok) {
    const desc = json?.description || "Telegram API error";
    throw new Error(desc);
  }
  return json.result as T;
}

/**
 * Daily reset boundary: 12:00 (noon) Myanmar time.
 * - If current time is 12:00 or later -> today's key
 * - If before 12:00 -> yesterday's key
 */
export function getDailyPeriodKey12pmMyanmar(now = new Date()): string {
  const parts = getMyanmarParts(now);
  const hour = Number(parts.hour);

  let y = Number(parts.year);
  let m = Number(parts.month);
  let d = Number(parts.day);

  if (hour < 12) {
    const prev = addDaysMyanmar(y, m, d, -1);
    y = prev.year;
    m = prev.month;
    d = prev.day;
  }

  const yyyy = String(y).padStart(4, "0");
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}@12`;
}

function getMyanmarParts(date: Date) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Rangoon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return map as {
    year: string;
    month: string;
    day: string;
    hour: string;
    minute: string;
  };
}

function addDaysMyanmar(year: number, month: number, day: number, deltaDays: number) {
  const approxUtc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  approxUtc.setUTCDate(approxUtc.getUTCDate() + deltaDays);

  const p = getMyanmarParts(approxUtc);
  return { year: Number(p.year), month: Number(p.month), day: Number(p.day) };
      }
