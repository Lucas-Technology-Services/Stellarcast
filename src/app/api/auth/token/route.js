import { NextResponse } from "next/server";
import { getExternalToken } from "@/services/externalApi";

export async function POST() {
    try {
        const tokenData = await getExternalToken();
        return NextResponse.json(
            { token: tokenData.token },
            { status: 200 }
        );
    }
    catch (err) {
        const message = err.message || "Unknown error";
        if (message.includes("401")) {
            return NextResponse.json(
                { error: "Unauthorize", details: message},
                { status: 401}
            );
        }
        if (message.includes("404")) {
            return NextResponse.json(
                { error: "Not found", details: message},
                { status: 404}
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error", details: message},
            { status: 500}
        );
    }
}