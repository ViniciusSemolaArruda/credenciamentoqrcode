
import { Suspense } from "react";
import { requireRole } from "@/lib/auth-guard";
import AdminBottomNav from "./components/AdminBottomNav";

async function AdminProtegido({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("ADMIN");

  return (
    <div className="min-h-dvh bg-[#080F15] text-white">
      <div
        style={{
          paddingBottom:
            "calc(68px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        {children}
      </div>

      <AdminBottomNav />
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#080F15] text-[#F4C75D]">
          Carregando...
        </div>
      }
    >
      <AdminProtegido>{children}</AdminProtegido>
    </Suspense>
  );
}
