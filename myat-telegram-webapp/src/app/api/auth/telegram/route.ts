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

  const { initData } = (await req.json().catch(() => ({}))) as { initData?: string };
  if (!initData) return NextResponse.json({ error: "Missing initData" }, { status: 400 });

  // 🚀 Vercel URL Safe ဖြစ်အောင် ဒေတာကို Clean လုပ်ခြင်း
  let cleanInitData = initData;
  try {
    const params = new URLSearchParams(initData);
    if (params.has("user") || params.has("hash")) {
      cleanInitData = params.toString();
    }
  } catch (e) {
    console.error("Error formatting initData on Vercel:", e);
  }

  // Telegram Signature စစ်ဆေးခြင်း
  const verified = verifyTelegramInitData(cleanInitData, botToken);
  if (!verified.ok) {
    console.error("Telegram verification failed:", verified.error);
    return NextResponse.json({ error: verified.error }, { status: 401 });
  }

  const tgUser = verified.data.user;
  if (!tgUser?.id) return NextResponse.json({ error: "Missing Telegram user" }, { status: 400 });

  const telegramId = String(tgUser.id);

  try {
    // Handle referrals
    const startParam = verified.data.start_param || "";
    const referrerId = parseReferrer(startParam);

    // 🚀 ပြင်ဆင်ချက် ၁: Prisma database crash ဖြစ်ခြင်းမှ ကာကွယ်ရန်
    const existing = await prisma.user.findUnique({ where: { telegramId } }).catch(() => null);

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

    // Referral Credit ပေးခြင်း
    if (!existing && referrerId && referrerId !== telegramId) {
      try {
        await prisma.$transaction(async (tx) => {
          const alreadyCredited = await tx.referralCredit.findUnique({
            where: { referredId: telegramId },
          });
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
        console.error("Referral crediting failed, but skipping to avoid blocking login:", refError);
      }
    }

    // 🚀 ပြင်ဆင်ချက် ၂: Session ဆောက်တဲ့နေရာကို စိတ်ချရအောင်လုပ်ခြင်း
    if (typeof setUserSession === "function") {
      await setUserSession(telegramId).catch((err) => {
        console.error("setUserSession logic failed:", err);
      });
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
    console.error("Database operation failed:", dbError);
    return NextResponse.json({ error: "Authentication failed internally", details: dbError.message }, { status: 500 });
  }
}

function parseReferrer(startParam: string): string | null {
  if (!startParam) return null;
  const v = startParam.startsWith("ref_") ? startParam.slice(4) : startParam;
  const cleaned = v.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  return cleaned;
}
  
