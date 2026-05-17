import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth";
import { verifyTelegramInitData } from "@/lib/telegram";

export const runtime = "nodejs";

// 🌟 Telegram ပုံအစား အတင်းပြောင်းလဲအသုံးပြုမည့် Premium Cute Avatars List
const premiumAvatars = [
  "https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Midnight&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/big-ears-neutral/svg?seed=Gizmo&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Bubba&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/fun-emoji/svg?seed=Luna&backgroundColor=d1d4f9"
];

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const initData = body.initData;

  if (!initData) {
    return NextResponse.json({ error: "Missing initData" }, { status: 400 });
  }

  const verified = verifyTelegramInitData(initData, botToken);
  if (!verified.ok) {
    console.error("Telegram verification failed:", verified.error);
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const tgUser = verified.data.user;
  if (!tgUser?.id) {
    return NextResponse.json({ error: "Missing Telegram user data" }, { status: 400 });
  }

  const telegramId = String(tgUser.id);

  try {
    const startParam = verified.data.start_param || "";
    const referrerId = parseReferrer(startParam);

    const existing = await prisma.user.findUnique({ where: { telegramId } }).catch(() => null);

    // 🚀 Telegram ပုံရှိလည်း မသုံးဘဲ Cute Avatar ကိုပဲ ယူဆာ ID အလိုက် အတင်းသတ်မှတ်ခြင်း
    const userIdNum = Number(telegramId || "0");
    const finalPhotoUrl = premiumAvatars[userIdNum % premiumAvatars.length];

    // ✨ User အချက်အလက်ကို ဒေတာဘေ့စ်ထဲ သိမ်းဆည်း/မွမ်းမံခြင်း လုပ်ငန်းစဉ်
    const user = await prisma.user.upsert({
      where: { telegramId },
      create: {
        // 🚀 Prisma build error မတက်အောင် ကန့်သတ်ချက်ရှိတဲ့ 'id' field ကိုဖြုတ်ပြီး telegramId ကိုပဲ အဓိကသုံးခိုင်းလိုက်ပါပြီ
        telegramId,
        username: tgUser.username || null,
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl,
        points: 0,
        reservedPoints: 0, 
        availablePoints: 0, 
        referrerId: !existing && referrerId && referrerId !== telegramId ? referrerId : null,
      },
      update: {
        // 🔄 လူဟောင်းပြန်ဝင်လာရင်လည်း နာမည်နှင့် Cute Avatar ပုံအသစ်ကို အတင်း Update ရိုက်ထည့်ခိုင်းခြင်း
        username: tgUser.username || null,
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl,
      },
    });

    // Referral Points ပေးခြင်း လုပ်ငန်းစဉ်
    if (!existing && referrerId && referrerId !== telegramId) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { telegramId: referrerId },
            data: { 
              points: { increment: 1500 },
              referralCount: { increment: 1 }
            },
          });
        });
      } catch (refError) {
        console.error("Referral transaction skipped:", refError);
      }
    }

    if (typeof setUserSession === "function") {
      await setUserSession(telegramId).catch((err) => console.error("Session build error:", err));
    }

    return NextResponse.json({
      ok: true,
      user: {
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        photoUrl: user.photoUrl,
        points: user.points,
        reservedPoints: user.reservedPoints,
        availablePoints: user.availablePoints || 0,
        referrerId: user.referrerId,
      }, 
    });

  } catch (dbError: any) {
    console.error("Database or Auth process crash:", dbError);
    return NextResponse.json({ error: "Internal Auth failed", details: dbError.message }, { status: 500 });
  }
}

function parseReferrer(startParam: string): string | null {
  if (!startParam) return null;
  const v = startParam.startsWith("ref_") ? startParam.slice(4) : startParam;
  const cleaned = v.replace(/[^0-9]/g, "");
  return cleaned || null;
      }
          
