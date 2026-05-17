import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth";
import { verifyTelegramInitData } from "@/lib/telegram";

export const runtime = "nodejs";

// 🌟 Premium Cute Avatars List
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

    // 🚀 Premium Cute Avatar တွက်ချက်ခြင်း
    const userIdNum = Number(telegramId || "0");
    const finalPhotoUrl = premiumAvatars[userIdNum % premiumAvatars.length];

    // ✨ Schema အသစ်အတိုင်း 'id' မပါဘဲ telegramId ကို Primary Key အဖြစ် ကွက်တိ သုံးထားပါတယ်
    const user = await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: tgUser.username || null,
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl,
        points: 0,
        reservedPoints: 0, 
        referrerId: !existing && referrerId && referrerId !== telegramId ? referrerId : null,
      },
      update: {
        username: tgUser.username || null,
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl,
      },
    });

    // 👥 Referral လုပ်ငန်းစဉ် (Schema အသစ်ထဲက ReferralCredit model အတိုင်း ကွက်တိ ပြင်ထားပါတယ်)
    if (!existing && referrerId && referrerId !== telegramId) {
      try {
        await prisma.$transaction(async (tx) => {
          // တကယ်လို့ database ထဲမှာ referrer တကယ်ရှိမှ Point တိုးပေးမယ်
          const refUser = await tx.user.findUnique({ where: { telegramId: referrerId } });
          if (refUser) {
            const alreadyCredited = await tx.referralCredit.findUnique({ where: { referredId: telegramId } });
            if (!alreadyCredited) {
              await tx.referralCredit.create({
                data: { referrerId, referredId: telegramId, points: 1500 },
              });

              await tx.user.update({
                where: { telegramId: referrerId },
                data: { points: { increment: 1500 } },
              });
            }
          }
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
