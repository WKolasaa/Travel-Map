import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE, API_BASE_URL, type AdminUser } from "@/lib/auth";

type BackendLoginResponse = {
  token: string;
  user: AdminUser;
};

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const payload = await response.json() as { detail?: string };
    return payload.detail ?? "Login failed";
  } catch {
    return "Login failed";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body,
      cache: "no-store"
    });
  } catch {
    return NextResponse.json(
      { detail: "Backend is unavailable. Make sure the API container is running and healthy." },
      { status: 503 }
    );
  }

  if (!response.ok) {
    const detail = await readErrorDetail(response);
    return NextResponse.json({ detail }, { status: response.status });
  }

  const payload = await response.json() as BackendLoginResponse;
  const nextResponse = NextResponse.json({ user: payload.user });
  nextResponse.cookies.set(ADMIN_SESSION_COOKIE, payload.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE
  });

  return nextResponse;
}