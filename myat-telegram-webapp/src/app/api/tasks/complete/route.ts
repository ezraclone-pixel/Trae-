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

  const body = (await req.json().catch(() => ({}))) as { taskKey?: string; score?: number };
  const { taskKey, score } = body;

  if (!taskKey) return NextResponse.json({ error: "Invalid task" }, { status: 400 });

  // 🕹️ GAME CLICKER TAP ENGINE FOR BACKEND
  if (taskKey === "game_clicker") {
    const pointsToAdd = Number(score || 0);
    if (isNaN(pointsToAdd) || pointsToAdd <= 0) {
      return NextResponse.json({ error: "Invalid score" }, { status: 400 });
    }

    try {
      // User Table ထဲက ပွိုင့်ကို တိုက်ရိုက် တိုးပေးမည်
      const updatedUser = await prisma.user.update({
        where: { telegramId: userId },
        data: { points: { increment: pointsToAdd } },
      });
      
      // Front-end Context ဆီ သွားညှိရန် User Object အသစ်ကို တန်းပြန်ပေးမည်
      return NextResponse.json({ ok: true, user: updatedUser });
    } catch (e: any) {
      return NextResponse.json({ error: "Failed to update game points", detail: e?.message }, { status: 500 });
    }
  }

  // 📝 STANDARD TASKS LOGIC (DAILY, FOLLOW, JOIN)
  if (!(taskKey in TASKS))
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
    if (String(e?.code) === "P2002") {
      return NextResponse.json({ ok: true, already: true });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
        }
