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

  // Frontend က ပို့လိုက်တဲ့ raw initData ကို ဖတ်ခြင်း
  const body = await req.json().catch(() => ({}));
  const initData = body.initData;

  if (!initData) {
    return NextResponse.json({ error: "Missing initData" }, { status: 400 });
  }

  // ဒေတာ စစ်ဆေးခြင်း
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
    // Referrer စစ်ဆေးခြင်း
    const startParam = verified.data.start_param || "";
    const referrerId = parseReferrer(startParam);

    const existing = await prisma.user.findUnique({ where: { telegramId } }).catch(() => null);

    // Database ထဲသို့ အသုံးပြုသူ သိမ်းဆည်းခြင်း/မွမ်းမံခြင်း
    const user = await prisma.user.upsert({
      where: { telegramId },
      create: {
        telegramId,
        username: tgUser.username || "",
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        photoUrl: tgUser.photo_url || "",
        referrerId: !existing && referrerId && referrerId !== telegramId ? referrerId : undefined,
      },
      update: {
        username: tgUser.username || "",
        firstName: tgUser.first_name || "",
        lastName: tgUser.last_name || "",
        photoUrl: tgUser.photo_url || "",
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
            data: { points: { increment: 1500 } },
          });
        });
      } catch (refError) {
        console.error("Referral transaction skipped:", refError);
      }
    }

    // Session ဆောက်ခြင်း
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
  
