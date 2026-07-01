import { NextResponse } from "next/server";
import { validateToken } from "@/services/auth_service";
import { loginUser } from "@/services/loginUser";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    const machineToken = authHeader.slice(7);
    await validateToken(machineToken);

    const body = await request.json();

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Missing required fields: email, password" },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err.message || "Unknown error";

    if (
      message === "token not found or expired" ||
      message === "invalid token"
    ) {
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401 },
      );
    }

    if (message === "invalid email or password") {
      return NextResponse.json(
        { error: "invalid email or password" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
