import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Next.js ကို Cache မလုပ်ဘဲ အမြဲတမ်း ဒေတာအသစ် ဆွဲခိုင်းခြင်း
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    // 🚀 Leaderboard အတွက် အဆင့်မြင့်ဆုံး ပွိုင့်အများဆုံး ၅၀ ကို ဆွဲထုတ်ခြင်း
    const top = await prisma.user.findMany({
      orderBy: [{ points: "desc" }, { createdAt: "asc" }],
      take: 50,
      select: {
        telegramId: true,
        username: true,
        firstName: true,
        lastName: true,
        photoUrl: true,
        points: true,
      },
    });

    // 💡 Frontend က မျှော်လင့်ထားတဲ့အတိုင်း ဒေတာကို Map လုပ်ပြီး ပို့ပေးခြင်း
    const formattedTop = top.map((u, idx) => ({
      ...u,
      rank: idx + 1,
      premium: idx < 3, // Top 3 ကို Premium ပေးခြင်း
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
