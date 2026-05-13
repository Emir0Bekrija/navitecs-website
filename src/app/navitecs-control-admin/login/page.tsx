import { Suspense } from "react";
import LoginClient from "@/components/admin/LoginClient";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
