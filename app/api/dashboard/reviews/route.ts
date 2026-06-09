import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserReviews } from "@/lib/queries/dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await getUserReviews(Number(session.user.id));
    return NextResponse.json({ reviews });
  } catch {
    return NextResponse.json({ reviews: [] });
  }
}
