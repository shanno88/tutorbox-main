// Admin authentication helper
import { headers } from "next/headers";

export function checkAdminAuth(): boolean {
  // 简单的 admin 鉴权：检查环境变量
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    // 如果没有设置 ADMIN_SECRET，在开发环境允许，生产环境拒绝
    return process.env.NODE_ENV === "development";
  }

  // 从请求头或 cookie 中获取 admin token
  const headersList = headers();
  const authHeader = headersList.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return false;
  }

  return token === adminSecret;
}

export function requireAdminAuth() {
  if (!checkAdminAuth()) {
    throw new Error("Unauthorized: Admin access required");
  }
}
