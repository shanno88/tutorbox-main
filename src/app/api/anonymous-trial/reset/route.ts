<<<<<<< HEAD
// API route to reset anonymous trial (dev only)
import { NextResponse } from "next/server";
import { ANONYMOUS_TRIAL_CONFIG } from "@/config/anonymous-trial";

export async function POST() {
  try {
    // Create a cookie deletion string by setting Max-Age to 0
    const deleteCookie = [
      `${ANONYMOUS_TRIAL_CONFIG.cookieName}=`,
      `Path=${ANONYMOUS_TRIAL_CONFIG.cookie.path}`,
      `Max-Age=0`,
      `SameSite=${ANONYMOUS_TRIAL_CONFIG.cookie.sameSite}`,
    ];

    if (ANONYMOUS_TRIAL_CONFIG.cookie.secure) {
      deleteCookie.push('Secure');
    }

    if (ANONYMOUS_TRIAL_CONFIG.cookie.httpOnly) {
      deleteCookie.push('HttpOnly');
    }

    const cookieString = deleteCookie.join('; ');

    return NextResponse.json(
      {
        ok: true,
        message: "Anonymous trial reset (dev only)",
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookieString,
        },
      }
    );
  } catch (error) {
    console.error("[anonymous-trial/reset] Error:", error);
    
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to reset anonymous trial",
      },
      { status: 500 }
    );
  }
}
=======
// API route to reset anonymous trial (dev only)
import { NextResponse } from "next/server";
import { ANONYMOUS_TRIAL_CONFIG } from "@/config/anonymous-trial";

export async function POST() {
  try {
    // Create a cookie deletion string by setting Max-Age to 0
    const deleteCookie = [
      `${ANONYMOUS_TRIAL_CONFIG.cookieName}=`,
      `Path=${ANONYMOUS_TRIAL_CONFIG.cookie.path}`,
      `Max-Age=0`,
      `SameSite=${ANONYMOUS_TRIAL_CONFIG.cookie.sameSite}`,
    ];

    if (ANONYMOUS_TRIAL_CONFIG.cookie.secure) {
      deleteCookie.push('Secure');
    }

    if (ANONYMOUS_TRIAL_CONFIG.cookie.httpOnly) {
      deleteCookie.push('HttpOnly');
    }

    const cookieString = deleteCookie.join('; ');

    return NextResponse.json(
      {
        ok: true,
        message: "Anonymous trial reset (dev only)",
      },
      {
        status: 200,
        headers: {
          'Set-Cookie': cookieString,
        },
      }
    );
  } catch (error) {
    console.error("[anonymous-trial/reset] Error:", error);
    
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to reset anonymous trial",
      },
      { status: 500 }
    );
  }
}
>>>>>>> origin/main
