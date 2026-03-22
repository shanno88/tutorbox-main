import { NextRequest, NextResponse } from "next/server";

const LICENSE_SERVER_URL = process.env.LICENSE_SERVER_URL;
const ADMIN_LICENSE_KEY = process.env.ADMIN_LICENSE_KEY;

export type LicenseStatus = "ok" | "error";

export interface LicenseCheckResponse {
  status: LicenseStatus;
  plan: string | null;
  expires_at: string | null;
  code: string | null;
}

/**
 * Validate the admin license with the FastAPI license server
 * @throws Error if LICENSE_SERVER_URL or ADMIN_LICENSE_KEY is not configured
 * @throws Error if the license server returns an HTTP error
 */
export async function validateAdminLicense(): Promise<LicenseCheckResponse> {
  if (!LICENSE_SERVER_URL) {
    throw new Error("LICENSE_SERVER_URL is not configured");
  }

  if (!ADMIN_LICENSE_KEY) {
    throw new Error("ADMIN_LICENSE_KEY is not configured");
  }

  const res = await fetch(`${LICENSE_SERVER_URL}/v1/licenses/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ license_key: ADMIN_LICENSE_KEY }),
  });

  if (!res.ok) {
    throw new Error(`License server HTTP error: ${res.status}`);
  }

  const data = (await res.json()) as LicenseCheckResponse;
  return data;
}

/**
 * Wrapper function to protect admin API routes with license validation
 * Usage:
 *   export const POST = withAdminLicense(async (req) => {
 *     // existing handler logic
 *   });
 */
type RouteHandler = (
  req: NextRequest,
  ctx?: any
) => Promise<NextResponse> | NextResponse;

export function withAdminLicense(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, ctx?: any) => {
    try {
      const license = await validateAdminLicense();

      if (license.status !== "ok") {
        return NextResponse.json(
          {
            error: "INVALID_LICENSE",
            code: license.code,
          },
          { status: 403 }
        );
      }

      return handler(req, ctx);
    } catch (err: any) {
      console.error("[license] License check failed", err);
      return NextResponse.json(
        {
          error: "LICENSE_SERVER_ERROR",
          message: err?.message || "Failed to validate license",
        },
        { status: 500 }
      );
    }
  };
}
