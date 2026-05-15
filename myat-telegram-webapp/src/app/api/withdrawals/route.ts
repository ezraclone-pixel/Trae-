import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { telegramApi } from "@/lib/telegram";

export const runtime = "nodejs";

const MIN_WITHDRAWAL = 50000;

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { points } = (await req.json().catch(() => ({}))) as { points?: number };
  const pts = Number(points);
  if (!Number.isFinite(pts) || pts <= 0) {
    return NextResponse.json({ error: "Invalid points" }, { status: 400 });
  }
  if (pts < MIN_WITHDRAWAL) {
    return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL} pts` }, { status: 400 });
  }
  if (pts % 10 !== 0) {
    return NextResponse.json({ error: "Points must be multiple of 10 (10pts = 1MMK)" }, { status: 400 });
  }

  const mmk = Math.floor(pts / 10);

  const withdrawal = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { telegramId: userId } });
    if (!user) throw new Error("User not found");

    const available = user.points - user.reservedPoints;
    if (available < pts) {
      return null;
    }

    const w = await tx.withdrawalRequest.create({
      data: { userId, points: pts, mmk },
    });

    await tx.user.update({
      where: { telegramId: userId },
      data: { reservedPoints: { increment: pts } },
    });

    return w;
  });

  if (!withdrawal) {
    return NextResponse.json({ error: "Not enough available points" }, { status: 400 });
  }

  // Optional: notify admin via bot
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const adminId = process.env.ADMIN_TELEGRAM_ID; // numeric id, optional
  if (botToken && adminId) {
    telegramApi(
      "sendMessage",
      {
        chat_id: Number(adminId),
        text: `New withdrawal request\nUser: ${userId}\nPoints: ${pts}\nMMK: ${mmk}\nID: ${withdrawal.id}`,
      },
      botToken,
    ).catch(() => {});
  }

  return NextResponse.json({ ok: true, withdrawal });
}
