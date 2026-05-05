import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  return (
    <div className="min-h-screen bg-dhl-light-gray">
      <header className="bg-dhl-dark text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/admin">
              <Image src="/dhl-logo.svg" alt="DHL" width={60} height={9} className="brightness-0 invert" />
            </Link>
            <span className="text-dhl-yellow font-bold text-sm">Admin Panel</span>
          </div>
          <Link href="/" className="text-white/70 hover:text-white text-sm">
            ← App
          </Link>
        </div>
        <nav className="flex gap-1 px-4 pb-2 max-w-4xl mx-auto overflow-x-auto">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/users", label: "Usuarios" },
            { href: "/admin/desks", label: "Puestos" },
            { href: "/admin/parking", label: "Parking" },
            { href: "/admin/incidents", label: "Incidentes" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white/70 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/10 whitespace-nowrap transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
