import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  return NextResponse.json({
    top: top.map((u, idx) => ({
      ...u,
      rank: idx + 1,
      premium: idx < 3,
      displayName: u.username
        ? `@${u.username}`
        : [u.firstName, u.lastName].filter(Boolean).join(" ") || u.telegramId,
    })),
    me: userId,
  });
}
