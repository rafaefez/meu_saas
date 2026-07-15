import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  let businessName: string | null = null;

  if (userId) {
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      include: { business: true },
    });
    businessName = user?.business?.name ?? null;
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {businessName && (
        <nav className="bg-white border-b border-neutral-200 px-6 py-3 flex items-center gap-6">
          <span className="font-semibold text-neutral-900 text-sm">{businessName}</span>
          <div className="flex gap-1 text-sm">
            <Link
              href="/dashboard/agenda"
              className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              Agenda
            </Link>
            <Link
              href="/dashboard/clientes"
              className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              Clientes
            </Link>
            <Link
              href="/dashboard/financeiro"
              className="px-3 py-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600"
            >
              Financeiro
            </Link>
          </div>
        </nav>
      )}
      {children}
    </div>
  );
}
