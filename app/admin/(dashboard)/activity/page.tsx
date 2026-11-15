import { redirect } from "next/navigation";

export default function ActivityRedirectPage() {
  redirect("/admin/activity-log");
}
