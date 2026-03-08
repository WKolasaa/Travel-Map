import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, API_BASE_URL } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  }

  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const nextResponse = NextResponse.json({ detail: "Invalid session" }, { status: response.status });
    nextResponse.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0)
    });
    return nextResponse;
  }

  const payload = await response.json();
  return NextResponse.json(payload);
}
