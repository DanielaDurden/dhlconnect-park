import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
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

  // Use admin client to bypass recursive RLS policy on profiles
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("profiles")
    .select("full_name, role, area, policy_accepted_at")
    .eq("id", user.id)
    .single();

  const needsPolicy = !profile?.policy_accepted_at;

  return (
    <div className="min-h-screen bg-dhl-light-gray flex flex-col">
      {/* Top Header */}
      <header className="bg-dhl-yellow sticky top-0 z-40 shadow-sm border-b border-yellow-300">
        <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto w-full">
          <Link href="/home">
            <Image
              src="/dhl-logo.svg"
              alt="DHL"
              width={72}
              height={10}
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/profile"
              aria-label="Mi perfil"
              className="text-dhl-dark/70 hover:text-dhl-dark transition-colors p-1"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden="true">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
            </Link>
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
