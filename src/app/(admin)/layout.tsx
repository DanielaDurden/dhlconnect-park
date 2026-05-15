import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const adminClient = createAdminClient();
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/home");

  return (
    <div className="min-h-screen bg-dhl-light-gray">
      <header className="bg-dhl-dark text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-6 h-14 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="bg-dhl-yellow rounded-lg px-3 py-1.5 flex items-center">
              <Image src="/dhl-logo.svg" alt="DHL" width={52} height={8} />
            </Link>
            <span className="text-dhl-yellow font-bold text-sm">Centro de Control</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-white/50 text-xs hidden lg:block">{profile?.full_name}</span>
            <form action={signOut}>
              <button
                type="submit"
                className="text-white/70 hover:text-white text-sm transition-colors border border-white/20 hover:border-white/50 rounded-lg px-3 py-1"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
        <nav className="flex gap-1 px-6 pb-2 max-w-7xl mx-auto overflow-x-auto">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/desks", label: "🗺️ Mapa" },
            { href: "/admin/parking", label: "🚗 Parking" },
            { href: "/admin/incidents", label: "⚠️ Incidentes" },
            { href: "/admin/rockstar", label: "🎸 Rockstar" },
            { href: "/admin/reportes", label: "📊 Reportes" },
            { href: "/admin/users", label: "👥 Usuarios" },
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
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
