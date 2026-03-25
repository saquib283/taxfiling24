import { redirect } from "next/navigation";

export default function HomepageRedirectPage() {
  redirect("/admin/content");
}
