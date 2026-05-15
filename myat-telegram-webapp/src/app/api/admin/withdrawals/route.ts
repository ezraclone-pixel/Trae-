import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminRequest } from "@/lib/auth";
import { telegramApi } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const list = await prisma.withdrawalRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    include: { user: { select: { telegramId: true, username: true, firstName: true, lastName: true, points: true, reservedPoints: true } } },
  });
  return NextResponse.json({ withdrawals: list });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    id?: string;
    action?: "accept" | "reject";
    note?: string;
  };
  if (!body.id || (body.action !== "accept" && body.action !== "reject")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawalRequest.findUnique({ where: { id: body.id } });
    if (!w) return null;
    if (w.status !== "PENDING") return w;

    if (body.action === "accept") {
      await tx.withdrawalRequest.update({
        where: { id: w.id },
        data: { status: "ACCEPTED", handledAt: new Date(), handledBy: "admin", note: body.note },
      });
      await tx.user.update({
        where: { telegramId: w.userId },
        data: {
          points: { decrement: w.points },
          reservedPoints: { decrement: w.points },
        },
      });
    } else {
      await tx.withdrawalRequest.update({
        where: { id: w.id },
        data: { status: "REJECTED", handledAt: new Date(), handledBy: "admin", note: body.note },
      });
      await tx.user.update({
        where: { telegramId: w.userId },
        data: { reservedPoints: { decrement: w.points } },
      });
    }

    return await tx.withdrawalRequest.findUnique({ where: { id: w.id } });
  });

  if (!result) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Optional notification
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken) {
    const text =
      body.action === "accept"
        ? `✅ Withdrawal accepted: ${result.points} pts (${result.mmk} MMK)`
        : `❌ Withdrawal rejected: ${result.points} pts (${result.mmk} MMK)\n${body.note || ""}`;
    telegramApi("sendMessage", { chat_id: Number(result.userId), text }, botToken).catch(() => {});
  }

  return NextResponse.json({ ok: true, withdrawal: result });
}
