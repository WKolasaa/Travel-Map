import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, API_BASE_URL } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ detail: "Authentication required" }, { status: 401 });
  }

  const formData = await request.formData();
  const response = await fetch(`${API_BASE_URL}/api/admin/uploads`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: formData,
    cache: "no-store"
  });

  const contentType = response.headers.get("content-type") ?? "application/json";
  const body = await response.text();
  const nextResponse = new NextResponse(body, {
    status: response.status,
    headers: {
      "Content-Type": contentType
    }
  });

  if (response.status === 401) {
    nextResponse.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: new Date(0)
    });
  }

  return nextResponse;
}