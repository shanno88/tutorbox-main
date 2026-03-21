// src/lib/with-admin-license.ts
import { NextResponse } from 'next/server'
import { checkLicense } from './license'

export function withAdminLicense<
  T extends (req: Request, ctx: any) => Promise<Response> | Response
>(handler: T): T {
  return (async (req: Request, ctx: any) => {
    const status = await checkLicense()

    if (status !== 'ACTIVE') {
      return NextResponse.json(
        {
          error: 'License required',
          code: 'LICENSE_INVALID',
        },
        { status: 403 },
      )
    }

    return handler(req, ctx)
  }) as T
}
