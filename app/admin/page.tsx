import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/admin-auth-clerk";
import { AdminDashboard } from "./admin-dashboard";

export default async function AdminPage() {
  await requireAdminAuth();
  return <AdminDashboard />;
}
