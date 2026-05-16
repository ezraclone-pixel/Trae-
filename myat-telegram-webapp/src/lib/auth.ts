import { NextRequest } from "next/server";
import { verifyTelegramInitData } from "./telegram";

// 🚀 Telegram Mini App (iframe) မှာ Cookie ပျောက်တဲ့ပြဿနာကို ကျော်လွှားရန် 
// Header ကနေတစ်ဆင့် ခွင့်ပြုချက် စစ်ဆေးမည့် စနစ်
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return null;

  // Frontend ကနေ headers: { "Authorization": "Bearer <initData>" } ဆိုပြီး ပို့လာပါလိမ့်မယ်
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const initData = authHeader.substring(7); // "Bearer " ရဲ့ နောက်က raw initData ကို ဖြတ်ယူခြင်း
  if (!initData) return null;

  try {
    const verified = verifyTelegramInitData(initData, botToken);
    if (!verified.ok || !verified.data?.user?.id) return null;

    return String(verified.data.user.id);
  } catch {
    return null;
  }
}

// ⚠️ အခြားဖိုင်တွေမှာ Error မတက်အောင် Function အဟောင်းတွေကို Empty ပုံစံပဲ ထားခဲ့ပါမယ်
export async function setUserSession(telegramId: string) { return; }
export async function clearUserSession() { return; }
export async function setAdminSession() { return; }
export async function clearAdminSession() { return; }
export async function isAdminRequest(req: NextRequest) { return false; }
  
