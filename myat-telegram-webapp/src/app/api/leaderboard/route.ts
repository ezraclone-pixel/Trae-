import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 🚀 Leaderboard အတွက် အမှတ်မလျော့မယ့် lifetime_points ကို ကြည့်ပြီး အစီအစဉ်ဆွဲခြင်း
    const top = await prisma.user.findMany({
      orderBy: [
        { lifetime_points: "desc" } as any, // SQL Column အသစ်ကို သုံးရန်
        { createdAt: "asc" }
      ],
      take: 50,
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        points: true,
        lifetime_points: true, // ပြသရန် ဆွဲထုတ်ခြင်း
      } as any,
    });

    const formattedTop = top.map((u: any, idx: number) => ({
      ...u,
      rank: idx + 1,
      premium: idx < 3, 
      points: u.lifetime_points ?? u.points, // Leaderboard ပေါ်မှာ အမြဲတမ်း ပုံသေတိုးနေတဲ့ Point ကိုပဲ ပြရန်
      displayName: u.username
        ? `@${u.username}`
        : [u.firstName, u.lastName].filter(Boolean).join(" ") || `User_${u.telegramId.slice(-4)}`,
    }));

    return NextResponse.json({
      top: formattedTop,
    });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    return NextResponse.json({ error: "Internal Server Error", top: [] }, { status: 500 });
  }
}
