import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import logger from "@/lib/utils/logger";

function getCookieDeletionHeaders() {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `sb-auth-token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax`,
  );
  return headers;
}

export async function POST() {
  try {
    const response = new NextResponse(
      JSON.stringify({ success: true, message: "Signed out successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
          Pragma: "no-cache",
        },
      },
    );

    const cookieHeaders = getCookieDeletionHeaders();
    cookieHeaders.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.append("Set-Cookie", value);
      }
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: () => "", set: () => {}, remove: () => {} } },
    );

    const { error } = await supabase.auth.signOut();
    if (error) {
      logger.logError("Error signing out", { error: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    logger.logInfo("User signed out successfully");
    return response;
  } catch (error) {
    logger.logError("Unexpected error in signout route", { error });
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
