import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserWishlist } from "@/lib/queries/dashboard";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const properties = await getUserWishlist(Number(session.user.id));
    return NextResponse.json({ properties });
  } catch {
    return NextResponse.json({ properties: [] });
  }
}
