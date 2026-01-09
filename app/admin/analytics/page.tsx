import { redirect } from "next/navigation";
import { requireAdminAuth } from "@/lib/admin-auth-clerk";
import { AdminAnalyticsClient } from "./admin-analytics-client";

export default async function AdminAnalyticsPage() {
  await requireAdminAuth();
  return <AdminAnalyticsClient />;
}
