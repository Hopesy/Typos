import { NextResponse } from "next/server";
import {
  clearAdminCookie,
  createAdminSessionToken,
  isAdminRequest,
  setAdminCookie,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store");
  return response;
}

function getPassword(value: unknown) {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return "";
  const password = (value as Record<string, unknown>).password;
  return typeof password === "string" ? password : "";
}

export async function GET(request: Request) {
  return noStore(NextResponse.json({ authorized: await isAdminRequest(request) }));
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return noStore(NextResponse.json({ error: "Invalid JSON body" }, { status: 400 }));
    }

    const password = getPassword(body);

    if (!(await verifyAdminPassword(password))) {
      return noStore(NextResponse.json({ error: "Invalid security key" }, { status: 401 }));
    }

    const token = await createAdminSessionToken();
    const response = NextResponse.json({ success: true });
    setAdminCookie(response, token, request);
    return noStore(response);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return noStore(NextResponse.json({ error: message }, { status: 500 }));
  }
}

export async function DELETE(request: Request) {
  const response = NextResponse.json({ success: true });
  clearAdminCookie(response, request);
  return noStore(response);
}
