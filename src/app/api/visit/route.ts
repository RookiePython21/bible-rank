import { NextResponse } from "next/server";
import { incrementVisitorCount } from "@/lib/verses";

export async function POST() {
  try {
    await incrementVisitorCount();
  } catch {
    // Visitor counting must never break the product experience.
  }
  return NextResponse.json({ ok: true });
}
