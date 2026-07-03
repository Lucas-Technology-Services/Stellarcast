import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import { requestPasswordReset } from "@/services/resetPassword";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    await validateToken(authHeader.slice(7));

    const body = await request.json().catch(() => ({}));
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 },
      );
    }

    await requestPasswordReset(email);

    return NextResponse.json(
      { message: "If this email is registered, you will receive a password reset link shortly." },
      { status: 200 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    if (message === "token not found or expired" || message === "invalid token") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (message === "email not found") {
      return NextResponse.json(
        { message: "If this email is registered, you will receive a password reset link shortly." },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
