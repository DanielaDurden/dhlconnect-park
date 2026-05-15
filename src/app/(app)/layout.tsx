import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import PolicyModal from "@/components/PolicyModal";
import PushSubscription from "@/components/PushSubscription";

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

  const cookieStore = await cookies();
  const policyCookie = cookieStore.get(`policy_accepted_${user.id}`)?.value === "1";

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role, area, policy_accepted_at")
    .eq("id", user.id)
    .single();

  const userRole = (profile?.role ?? "guest") as import("@/types").UserRole;

  if (userRole === "admin") redirect("/admin");

  const needsPolicy = !policyCookie && !profile?.policy_accepted_at;

  return (
    <div className="min-h-screen bg-dhl-light-gray flex flex-col">
      {/* ── Header ── */}
      <header className="bg-dhl-yellow sticky top-0 z-40 shadow-sm border-b border-yellow-300">
        <div className="flex items-center justify-between px-4 lg:px-6 h-14 max-w-7xl mx-auto w-full">
          <Link href="/home">
            <Image src="/dhl-logo.svg" alt="DHL" width={72} height={10} priority />
          </Link>

          <div className="flex items-center gap-3">
            {/* Profile visible on mobile; sidebar has it on desktop */}
            <Link
              href="/profile"
              aria-label="Mi perfil"
              className="lg:hidden text-dhl-dark/70 hover:text-dhl-dark transition-colors p-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </Link>
            {/* Show name on desktop header */}
            {profile?.full_name && (
              <span className="hidden lg:block text-dhl-dark/60 text-sm font-medium">
                {profile.full_name.split(" ")[0]}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* ── Policy Modal ── */}
      {needsPolicy && <PolicyModal />}

      {/* ── Push Subscription ── */}
      <PushSubscription />

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* BottomNav renders desktop sidebar (hidden on mobile) + mobile bottom bar (hidden on desktop) */}
        <BottomNav role={userRole} />

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
