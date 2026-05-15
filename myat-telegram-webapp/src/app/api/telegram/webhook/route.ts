import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDailyPeriodKey12pmMyanmar } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const got = req.headers.get("x-telegram-bot-api-secret-token");
    if (got !== secret) return NextResponse.json({ ok: true });
  }

  const update = await req.json().catch(() => null);
  if (!update) return NextResponse.json({ ok: true });

  const msg = update.message || update.edited_message;
  if (!msg?.from?.id) return NextResponse.json({ ok: true });

  const communityUsername = (process.env.COMMUNITY_GROUP_USERNAME || "myat_2055G").toLowerCase();
  const chatUsername = String(msg.chat?.username || "").toLowerCase();
  if (chatUsername && chatUsername !== communityUsername) return NextResponse.json({ ok: true });

  const text = String(msg.text || "").trim();
  if (text !== "Let's Go with Myat") return NextResponse.json({ ok: true });

  const userId = String(msg.from.id);
  const periodKey = getDailyPeriodKey12pmMyanmar();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.taskCompletion.create({
        data: { userId, taskKey: "phrase", periodKey, meta: { chatId: msg.chat?.id } },
      });
      await tx.user.update({
        where: { telegramId: userId },
        data: { points: { increment: 500 } },
      });
    });
  } catch (e: any) {
    // already completed -> ignore
    if (String(e?.code) !== "P2002") throw e;
  }

  return NextResponse.json({ ok: true });
}
