import { NextResponse } from "next/server";
import { CreateUser } from "@/services/userService";

export async function POST(request) {
  try {
    const body = await request.json();

    const { email, password, access_type } = body;

    if (!email || !password || !access_type) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, access_type" },
        { status: 400 }
      );
    }

    const result = await CreateUser({ email, password, access_type });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    const message = err.message || "Unknown error";

    if (message.includes("401")) {
      return NextResponse.json(
        { error: "Unauthorized", details: message },
        { status: 401 }
      );
    }

    if (message.includes("404")) {
      return NextResponse.json(
        { error: "Not Found", details: message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal Server Error", details: message },
      { status: 500 }
    );
  }
}
