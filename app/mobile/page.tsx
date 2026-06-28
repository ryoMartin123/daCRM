import { redirect } from "next/navigation";

// Entry point — the installed PWA and /mobile both land on Today.
export default function MobileIndex() {
  redirect("/mobile/today");
}
