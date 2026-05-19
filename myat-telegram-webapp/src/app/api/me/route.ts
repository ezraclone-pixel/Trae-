import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDailyPeriodKey12pmMyanmar } from "@/lib/telegram";

export const dynamic = "force-dynamic"; 
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodKey = getDailyPeriodKey12pmMyanmar();

  try {
    const user = await prisma.user.findUnique({
      where: { telegramId: userId },
    });

    let finalUser = user;
    if (!user) {
      finalUser = await prisma.user.create({
        data: {
          telegramId: userId,
          points: 0,
          reservedPoints: 0,
          lifetime_points: 0, // SQL အသစ်အတွက် ထည့်သွင်းခြင်း
        } as any, // Prisma schema update မလုပ်ရသေးရင် error မတက်အောင် cast ထားခြင်း
      });
    }

    const [daily, once, referralCount] = await Promise.all([
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

    const doneDaily = new Set(daily.map((d) => d.taskKey));
    const doneOnce = new Set(once.map((d) => d.taskKey));

    return NextResponse.json({
      user: {
        telegramId: finalUser!.telegramId,
        username: finalUser!.username || null, 
        firstName: finalUser!.firstName || "Telegram User",
        lastName: finalUser!.lastName || null,
        photoUrl: finalUser!.photoUrl || null, 
        points: finalUser!.points, // လက်ရှိသုံးလို့ရမယ့် Home & Profile က Balance
        lifetime_points: (finalUser as any)!.lifetime_points ?? finalUser!.points, // Leaderboard အတွက်
        reservedPoints: finalUser!.reservedPoints,
        availablePoints: finalUser!.points - finalUser!.reservedPoints,
        referrerId: finalUser!.referrerId,
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
  } catch (error: any) {
    console.error("Error in /api/me:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
        }
                                                            
