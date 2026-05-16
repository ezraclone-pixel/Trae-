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

  // 🚀 Vercel နဲ့ အကိုက်ညီဆုံးဖြစ်အောင် ဒေတာကို ခွဲထုတ်ပြီး Clean Query ဖြစ်အောင် အရင်လုပ်မယ်
  let cleanInitData = initData;
  try {
    const params = new URLSearchParams(initData);
    // အကယ်၍ အထဲမှာ သေချာစစ်ဖို့ ဒေတာတွေ ပါလာခဲ့ရင် ပုံစံတကျ string ပြန်ပြောင်းပေးခြင်း
    if (params.has("user") || params.has("hash")) {
      cleanInitData = params.toString();
    }
  } catch (e) {
    console.error("Error formatting initData on Vercel:", e);
  }

  // စနစ်တကျ ညှိပြီးသား cleanInitData ကို သုံးပြီး စစ်ဆေးမယ်
  const verified = verifyTelegramInitData(cleanInitData, botToken);
  if (!verified.ok) return NextResponse.json({ error: verified.error }, { status: 401 });

  const tgUser = verified.data.user;
  if (!tgUser?.id) return NextResponse.json({ error: "Missing Telegram user" }, { status: 400 });

  const telegramId = String(tgUser.id);

  // Handle referrals (only on first time we see the user)
  const startParam = verified.data.start_param || "";
  const referrerId = parseReferrer(startParam);

  const existing = await prisma.user.findUnique({ where: { telegramId } });

  const user = await prisma.user.upsert({
    where: { telegramId },
    create: {
      telegramId,
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
      referrerId:
        !existing && referrerId && referrerId !== telegramId ? referrerId : undefined,
    },
    update: {
      username: tgUser.username,
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      photoUrl: tgUser.photo_url,
    },
  });

  // If first login with referrer -> credit 1500 to referrer (once per referred user)
  if (!existing && referrerId && referrerId !== telegramId) {
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
  }

  await setUserSession(telegramId);

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
}

function parseReferrer(startParam: string): string | null {
  if (!startParam) return null;
  const v = startParam.startsWith("ref_") ? startParam.slice(4) : startParam;
  const cleaned = v.replace(/[^0-9]/g, "");
  if (!cleaned) return null;
  return cleaned;
}
  
