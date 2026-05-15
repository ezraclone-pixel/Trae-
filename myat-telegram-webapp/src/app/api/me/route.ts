import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDailyPeriodKey12pmMyanmar } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periodKey = getDailyPeriodKey12pmMyanmar();

  const [user, daily, once, referralCount] = await Promise.all([
    prisma.user.findUnique({ where: { telegramId: userId } }),
    prisma.taskCompletion.findMany({
      where: { userId, periodKey, taskKey: { in: ["daily_login", "phrase"] } },
      select: { taskKey: true },
    }),
    prisma.taskCompletion.findMany({
      where: { userId, periodKey: "once", taskKey: { in: ["follow_channel", "join_group"] } },
      select: { taskKey: true },
    }),
    prisma.user.count({ where: { referrerId: userId } }),
  ]);

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const doneDaily = new Set(daily.map((d) => d.taskKey));
  const doneOnce = new Set(once.map((d) => d.taskKey));

  return NextResponse.json({
    user: {
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      points: user.points,
      reservedPoints: user.reservedPoints,
      availablePoints: user.points - user.reservedPoints,
      referrerId: user.referrerId,
      referralCount,
    },
    tasks: {
      periodKey,
      daily_login: doneDaily.has("daily_login"),
      phrase: doneDaily.has("phrase"),
      follow_channel: doneOnce.has("follow_channel"),
      join_group: doneOnce.has("join_group"),
    },
    config: {
      rate: { ptsPerMMK: 10 },
      minWithdrawalPts: 50000,
      mainChannel: process.env.MAIN_CHANNEL_USERNAME ? `@${process.env.MAIN_CHANNEL_USERNAME}` : "@Myat_2055",
      communityGroup: process.env.COMMUNITY_GROUP_USERNAME ? `@${process.env.COMMUNITY_GROUP_USERNAME}` : "@myat_2055G",
    },
  });
}
