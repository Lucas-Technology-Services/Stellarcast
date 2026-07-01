import { NextResponse } from "next/server";
import { CreateUser } from "@/services/userService";

export async function POST(request) {
  try {
    const body = await request.json();

    const { email, password, access_type } = body;

    if (!email || !password || !access_type) {
      return NextResponse.json(
        { error: "email, password and access_type are required" },
        { status: 400 },
      );
    }

    if (access_type !== "producer" && access_type !== "viewer") {
      return NextResponse.json(
        { error: "access_type must be 'producer' or 'viewer'" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const result = await CreateUser({ email, password, access_type });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";

    if (
      message.includes("duplicate") ||
      message.includes("unique") ||
      message.includes("unique constraint")
    ) {
      return NextResponse.json(
        { error: "email already in use" },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 },
    );
  }
}
