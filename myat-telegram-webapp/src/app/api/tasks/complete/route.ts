import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDailyPeriodKey12pmMyanmar, telegramApi } from "@/lib/telegram";

export const runtime = "nodejs";

const TASKS = {
  daily_login: { type: "daily" as const, points: 500 },
  follow_channel: { type: "once" as const, points: 1000 },
  join_group: { type: "once" as const, points: 1000 },
};

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { taskKey } = (await req.json().catch(() => ({}))) as { taskKey?: string };
  if (!taskKey || !(taskKey in TASKS))
    return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  const def = (TASKS as any)[taskKey] as { type: "daily" | "once"; points: number };
  const periodKey = def.type === "daily" ? getDailyPeriodKey12pmMyanmar() : "once";

  // For follow/join we verify via bot API.
  if (taskKey === "follow_channel" || taskKey === "join_group") {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const chatUsername =
      taskKey === "follow_channel"
        ? process.env.MAIN_CHANNEL_USERNAME || "Myat_2055"
        : process.env.COMMUNITY_GROUP_USERNAME || "myat_2055G";

    try {
      const member = await telegramApi<any>(
        "getChatMember",
        { chat_id: `@${chatUsername}`, user_id: Number(userId) },
        botToken,
      );
      const status = String(member?.status || "");
      if (status === "left" || status === "kicked") {
        return NextResponse.json(
          { error: `You are not a member of @${chatUsername} yet.` },
          { status: 400 },
        );
      }
    } catch (e: any) {
      return NextResponse.json(
        {
          error:
            "Cannot verify via Telegram API yet. Please add the bot to the group and make it admin in the channel, then try again.",
          detail: e?.message,
        },
        { status: 400 },
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.taskCompletion.create({
        data: { userId, taskKey, periodKey },
      });
      await tx.user.update({
        where: { telegramId: userId },
        data: { points: { increment: def.points } },
      });
    });
  } catch (e: any) {
    // Unique constraint -> already completed
    if (String(e?.code) === "P2002") {
      return NextResponse.json({ ok: true, already: true });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
