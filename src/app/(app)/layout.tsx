import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import PolicyModal from "@/components/PolicyModal";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, area, policy_accepted_at")
    .eq("id", user.id)
    .single();

  const needsPolicy = !profile?.policy_accepted_at;

  async function handleSignOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-dhl-light-gray flex flex-col">
      {/* Top Header */}
      <header className="bg-dhl-red text-white sticky top-0 z-40 shadow-md">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto w-full">
          <Link href="/home">
            <Image
              src="/dhl-logo.svg"
              alt="DHL"
              width={72}
              height={10}
              className="brightness-0 invert"
              priority
            />
          </Link>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-white/80 leading-none">
                {profile?.area ?? "DHL"}
              </p>
              <p className="text-sm font-semibold leading-tight">
                {profile?.full_name?.split(" ")[0] ?? "Usuario"}
              </p>
            </div>

            {profile?.role === "admin" && (
              <Link
                href="/admin"
                className="bg-dhl-yellow text-dhl-dark text-xs font-bold px-2 py-1 rounded-lg"
              >
                Admin
              </Link>
            )}

            <form action={handleSignOut}>
              <button
                type="submit"
                className="text-white/70 hover:text-white transition-colors"
                title="Cerrar sesión"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Policy Modal (first login) */}
      {needsPolicy && <PolicyModal />}

      {/* Main Content */}
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
