import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromRequest } from "@/lib/auth";

export const runtime = "nodejs";

const WEBSITE_PRODUCTS: Record<
  string,
  { title: string; priceMMK: number | null }
> = {
  relationship: { title: "For your relationship website", priceMMK: 15500 },
  portfolio: { title: "For your portfolio website", priceMMK: 15500 },
  products: { title: "For Your products website", priceMMK: null }, // nego
  customize: { title: "Customize Website", priceMMK: null }, // nego
};

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    category?: "WEBSITE" | "APP";
    productKey?: string;
  };

  if (body.category !== "WEBSITE") {
    return NextResponse.json({ error: "Coming soon" }, { status: 400 });
  }
  if (!body.productKey || !WEBSITE_PRODUCTS[body.productKey]) {
    return NextResponse.json({ error: "Invalid product" }, { status: 400 });
  }

  const productKey = body.productKey;
  const product = WEBSITE_PRODUCTS[productKey];
  const priceMMK = product.priceMMK;
  const pointsEarned = priceMMK ? priceMMK : 0; // your rule => points = MMK

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        userId,
        category: "WEBSITE",
        productKey,
        priceMMK: priceMMK ?? undefined,
        pointsEarned,
      },
    });

    if (pointsEarned > 0) {
      await tx.user.update({
        where: { telegramId: userId },
        data: { points: { increment: pointsEarned } },
      });
    }

    return created;
  });

  return NextResponse.json({ ok: true, order });
}
