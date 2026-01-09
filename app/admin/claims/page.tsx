import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/admin-auth-clerk";
import { AdminClaimsClient } from "./admin-claims-client";

export default async function AdminClaimsPage() {
  await requireAdminAuth();
  return <AdminClaimsClient />;
}
