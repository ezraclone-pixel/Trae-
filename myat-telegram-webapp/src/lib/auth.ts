import { NextRequest } from "next/server";

export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  // 1. Frontend ကနေ headers: { "Authorization": "Bearer <initData>" } ပို့လာတာကို ဖတ်မယ်
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;

  const initData = authHeader.substring(7); // "Bearer " နောက်က raw initData ကို ဖြတ်ယူခြင်း
  if (!initData) return null;

  try {
    // 🚀 [Bypass Auth] Telegram ရဲ့ Secure Hash စစ်ဆေးမှုကို ကျော်ဖြတ်ပြီး 
    // initData ထဲက user အချက်အလက်ကို URLSearchParams နဲ့ တိုက်ရိုက် parsing လုပ်ပြီး ID ကို ဆွဲထုတ်မယ်
    const params = new URLSearchParams(initData);
    const userParam = params.get("user");
    
    if (userParam) {
      const userData = JSON.parse(userParam);
      if (userData && userData.id) {
        console.log("🚀 [Bypass Auth] Handled Telegram User ID:", userData.id);
        return String(userData.id); // ရလာတဲ့ User ID ကို Database ဆီ တန်းပို့ပေးလိုက်မယ်
      }
    }
    return null;
  } catch (error) {
    console.error("Auth bypass error:", error);
    return null;
  }
}

// ⚠️ အခြားဖိုင်တွေမှာ Error မတက်အောင် Function အဟောင်းများကို ပုံစံမပျက် ထားခဲ့ခြင်း
export async function setUserSession(telegramId: string) { return; }
export async function clearUserSession() { return; }
export async function setAdminSession() { return; }
export async function clearAdminSession() { return; }
export async function isAdminRequest(req: NextRequest) { return false; }
