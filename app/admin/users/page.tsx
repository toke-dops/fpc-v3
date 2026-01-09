import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/admin-auth-clerk";
import { AdminUsersClient } from "./admin-users-client";

export default async function AdminUsersPage() {
  await requireAdminAuth();
  return <AdminUsersClient />;
}
