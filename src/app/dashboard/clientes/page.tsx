import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const params = await searchParams;
  const query = params.q?.trim() || "";

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) redirect("/dashboard/onboarding");

  const customers = await db.customer.findMany({
    where: {
      businessId: user.business.id,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    },
    include: {
      appointments: { orderBy: { datetime: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-5">Clientes</h1>

      <form method="GET" className="mb-6">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="Buscar cliente pelo nome..."
          className="w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-neutral-900"
        />
      </form>

      {customers.length === 0 && (
        <div className="border border-dashed border-neutral-300 rounded-xl p-10 text-center text-neutral-400">
          {query ? `Nenhum cliente encontrado para "${query}".` : "Nenhum cliente ainda — assim que alguém agendar, aparece aqui."}
        </div>
      )}

      <div className="space-y-2">
        {customers.map((c) => {
          const concluidos = c.appointments.filter((a) => a.status === "concluido").length;
          const ultimo = c.appointments[0];
          return (
            <Link
              key={c.id}
              href={`/dashboard/clientes/${c.id}`}
              className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3 hover:border-neutral-400 transition"
            >
              <div>
                <p className="font-medium text-neutral-900">{c.name}</p>
                <p className="text-sm text-neutral-500">{c.phone}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-600">
                  {concluidos} atendimento{concluidos !== 1 ? "s" : ""}
                </p>
                {ultimo && (
                  <p className="text-xs text-neutral-400">
                    último: {ultimo.datetime.toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
