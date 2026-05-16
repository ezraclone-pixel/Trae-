import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";
import { getDailyPeriodKey12pmMyanmar } from "@/lib/telegram";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const periodKey = getDailyPeriodKey12pmMyanmar();

  try {
    // 🚀 [အဓိကပြင်ဆင်ချက်] User မရှိသေးရင် ဒေတာဘေ့စ်ထဲမှာ အလိုအလျောက် Create လုပ်ပေးမည့် စနစ်
    const user = await prisma.user.upsert({
      where: { telegramId: userId },
      update: {}, // ရှိပြီးသားဆိုရင် ဘာမှမလုပ်ဘူး
      create: {
        telegramId: userId,
        points: 0,
        reservedPoints: 0,
      },
    });

    // User ရှိသွားပြီဖြစ်တဲ့အတွက် ကျန်တဲ့ Task တွေနဲ့ Referral တွေကို ဆက်ဆွဲမယ်
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
  } catch (error: any) {
    console.error("Error in /api/me:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
