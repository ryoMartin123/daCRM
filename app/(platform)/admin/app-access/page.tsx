import { redirect } from "next/navigation";

// App Access merged into Users & Access. Preserve the old route + any deep links
// by redirecting to the Access Matrix view.
export default function AdminAppAccessPage() {
  redirect("/admin/users?view=matrix");
}
