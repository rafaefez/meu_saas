import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";
import TransactionRow from "./transaction-row";

type Filter = "all" | "pago" | "pendente";

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const filter = (params.status as Filter) || "all";

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) redirect("/dashboard/onboarding");

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const allTx = await db.transaction.findMany({
    where: { businessId: user.business.id },
    include: { appointment: { include: { customer: true, service: true } } },
    orderBy: { date: "desc" },
  });

  const recebidoMes = allTx
    .filter((t) => t.status === "pago" && t.date >= monthStart && t.date <= monthEnd)
    .reduce((sum, t) => sum + t.amount, 0);
  const pendenteTotal = allTx
    .filter((t) => t.status === "pendente")
    .reduce((sum, t) => sum + t.amount, 0);
  const recebidoTotal = allTx
    .filter((t) => t.status === "pago")
    .reduce((sum, t) => sum + t.amount, 0);

  const filtered = filter === "all" ? allTx : allTx.filter((t) => t.status === filter);

  const FILTERS: { value: Filter; label: string }[] = [
    { value: "all", label: "Todos" },
    { value: "pendente", label: "Pendentes" },
    { value: "pago", label: "Pagos" },
  ];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-5">Financeiro</h1>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Recebido este mês</p>
          <p className="text-xl font-bold text-green-700">R$ {recebidoMes.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">A receber</p>
          <p className="text-xl font-bold text-amber-600">R$ {pendenteTotal.toFixed(2)}</p>
        </div>
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <p className="text-xs text-neutral-400 uppercase tracking-wide">Recebido total</p>
          <p className="text-xl font-bold text-neutral-900">R$ {recebidoTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/financeiro?status=${f.value}`}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              filter === f.value
                ? "bg-neutral-900 text-white border-neutral-900"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-xl p-10 text-center text-neutral-400">
          Nenhum registro nesse filtro.
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} />
        ))}
      </div>
    </main>
  );
}
