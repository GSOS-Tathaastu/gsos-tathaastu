// frontend/app/admin/page.tsx
import { redirect } from "next/navigation";

export default function AdminIndex() {
  // Default landing for /admin
  redirect("/admin/health");
}
