import { redirect } from "next/navigation";

export default function Home() {
  // Land on the platform launcher (the welcome screen), not straight into the CRM.
  redirect("/welcome");
}
