export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dhl-red flex flex-col">
      {children}
    </div>
  );
}
