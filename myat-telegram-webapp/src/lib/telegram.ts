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
  if (!initData) return { ok: false as const, error: "Missing initData" };

  try {
    const pairs = initData.split("&");
    let telegramHash = "";
    const dataCheckPairs: string[] = [];

    for (const pair of pairs) {
      const [key, ...valueParts] = pair.split("=");
      const value = valueParts.join("="); 
      
      const decodedKey = decodeURIComponent(key);
      const decodedValue = decodeURIComponent(value);

      if (decodedKey === "hash") {
        telegramHash = decodedValue;
      } else {
        dataCheckPairs.push(`${decodedKey}=${decodedValue}`);
      }
    }

    if (!telegramHash) return { ok: false as const, error: "Missing hash" };

    dataCheckPairs.sort();
    const dataCheckString = dataCheckPairs.join("\n");

    const secretKey = crypto
      .createHmac("sha256", "WebAppData")
      .update(botToken)
      .digest();

    const calculatedHash = crypto
      .createHmac("sha256", secretKey)
      .update(dataCheckString)
      .digest("hex");

    const ok = timingSafeEqualHex(calculatedHash, telegramHash);
    if (!ok) return { ok: false as const, error: "Invalid signature" };

    // 🚀 [အဓိကပြင်ဆင်ချက်] JSON Value ထဲက '=' သင်္ကေတတွေ အလွဲမဝင်အောင် စနစ်တကျ ခွဲထုတ်ခြင်း
    const init: TelegramInitData = {};
    for (const pair of dataCheckPairs) {
      const [k, ...vParts] = pair.split("="); // 👈 ပထမ '=' တစ်ခုတည်းကိုပဲ ခွဲထုတ်ရန် ပြင်ဆင်ခြင်း
      const v = vParts.join("=");
      
      if (k === "user") {
        try {
          init.user = JSON.parse(v); // ယခုဆိုလျှင် JSON တစ်ခုလုံး ကွက်တိ ပတ်စ် လုပ်နိုင်ပါပြီ
        } catch (e) {
          console.error("Failed to parse telegram user JSON:", e);
        }
      } else {
        (init as any)[k] = v;
      }
    }

    return { ok: true as const, data: init };
  } catch (err: any) {
    return { ok: false as const, error: err.message || "Verification crash" };
  }
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

export function getDailyPeriodKey12pmMyanmar(now = new Date()): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Rangoon",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false
  });
  const parts = fmt.formatToParts(now);
  const map: Record<string, string> = {};
  for (const p of parts) if (p.type !== "literal") map[p.type] = p.value;

  let y = Number(map.year), m = Number(map.month), d = Number(map.day);
  if (Number(map.hour) < 12) {
    const prev = new Date(Date.UTC(y, m - 1, d, 12));
    prev.setUTCDate(prev.getUTCDate() - 1);
    const p2 = fmt.formatToParts(prev);
    const m2: Record<string, string> = {};
    for (const p of p2) if (p.type !== "literal") m2[p.type] = p.value;
    y = Number(m2.year); m = Number(m2.month); d = Number(m2.day);
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}@12`;
    }
