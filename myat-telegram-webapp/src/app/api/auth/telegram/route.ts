import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setUserSession } from "@/lib/auth";
import { verifyTelegramInitData } from "@/lib/telegram";

export const runtime = "nodejs";

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

    // 🚀 Telegram က ပုံ URL မပေးရင် သုံးဖို့အတွက် Standard Avatar URL တစ်ခု ဖန်တီးခြင်း
    const fallbackPhoto = tgUser.username 
      ? `https://t.me/i/userpic/320/${tgUser.username}.jpg`
      : null;

    const finalPhotoUrl = tgUser.photo_url || fallbackPhoto;

    // ✨ ယူဆာအသစ်ဝင်တိုင်း Telegram ဒေတာတွေကို အလိုအလျောက် ကွက်တိ သိမ်းဆည်း/မွမ်းမံခြင်း
    const user = await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: tgUser.username || null, // Empty String အစား NULL အဖြစ် သန့်သန့်ရှင်းရှင်းသိမ်းခြင်း
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl,
        points: 0,
        availablePoints: 0,
        reservedPoints: 0,
        referrerId: !existing && referrerId && referrerId !== telegramId ? referrerId : null,
      },
      update: {
        // 🔄 လူဟောင်းပြန်ဝင်လာရင်လည်း Telegram နာမည် သို့မဟုတ် ပုံ ပြောင်းသွားပါက လိုက်ပြင်ပေးရန်
        username: tgUser.username || null,
        firstName: tgUser.first_name || "Telegram User",
        lastName: tgUser.last_name || null,
        photoUrl: finalPhotoUrl || null,
      },
    });

    // Referral Points ပေးခြင်း လုပ်ငန်းစဉ်
    if (!existing && referrerId && referrerId !== telegramId) {
      try {
        await prisma.$transaction(async (tx) => {
          const alreadyCredited = await tx.referralCredit.findUnique({ where: { referredId: telegramId } });
          if (alreadyCredited) return;

          await tx.referralCredit.create({
            data: { referrerId, referredId: telegramId, points: 1500 },
          });

          await tx.user.update({
            where: { telegramId: referrerId },
            data: { 
              points: { increment: 1500 },
              availablePoints: { increment: 1500 }
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
        
