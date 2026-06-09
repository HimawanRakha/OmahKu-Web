import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserTransactions } from "@/lib/queries/dashboard";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;

  try {
    const transactions = await getUserTransactions(
      Number(session.user.id),
      status,
    );
    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ transactions: [] });
  }
}
