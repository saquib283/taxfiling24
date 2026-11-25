import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE_OPTIONS, verifyAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function POST() {
  try {
    const user = await verifyAdmin();
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "", {
      ...ADMIN_COOKIE_OPTIONS,
      maxAge: 0,
    });

    if (user) {
      await logActivity("LOGOUT", "Auth", `${user.name} signed out`, user.userId, user.userId);
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Failed to log out" }, { status: 500 });
  }
}
