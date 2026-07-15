"use client";

import { useState, useTransition } from "react";
import { markTransactionPaid, markTransactionPending } from "./actions";

const METHOD_LABEL: Record<string, string> = { pix: "Pix", dinheiro: "Dinheiro", cartao: "Cartão" };

type Tx = {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  date: Date;
  appointment: {
    customer: { name: string };
    service: { name: string };
  } | null;
};

export default function TransactionRow({ tx }: { tx: Tx }) {
  const [showMethods, setShowMethods] = useState(false);
  const [isPending, startTransition] = useTransition();

  function pay(method: "pix" | "dinheiro" | "cartao") {
    startTransition(async () => {
      await markTransactionPaid(tx.id, method);
      setShowMethods(false);
    });
  }

  function undo() {
    startTransition(async () => {
      await markTransactionPending(tx.id);
    });
  }

  return (
    <div className="flex items-center justify-between bg-white border border-neutral-200 rounded-xl px-4 py-3 gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-neutral-900 truncate">
          {tx.appointment?.customer.name ?? "—"}
        </p>
        <p className="text-sm text-neutral-500 truncate">
          {tx.appointment?.service.name} · {tx.date.toLocaleDateString("pt-BR")}
        </p>
      </div>

      <p className="font-semibold text-neutral-900 flex-shrink-0 whitespace-nowrap">
        R$ {tx.amount.toFixed(2)}
      </p>

      <div className="flex-shrink-0">
        {tx.status === "pago" ? (
          <div className="text-right">
            <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 whitespace-nowrap">
              Pago · {METHOD_LABEL[tx.method ?? ""] ?? "—"}
            </span>
            <button
              onClick={undo}
              disabled={isPending}
              className="block text-xs text-neutral-400 underline mt-1 ml-auto disabled:opacity-50"
            >
              desfazer
            </button>
          </div>
        ) : showMethods ? (
          <div className="flex gap-1">
            {(["pix", "dinheiro", "cartao"] as const).map((m) => (
              <button
                key={m}
                disabled={isPending}
                onClick={() => pay(m)}
                className="text-xs px-2 py-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 whitespace-nowrap"
              >
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        ) : (
          <button
            onClick={() => setShowMethods(true)}
            className="text-xs px-3 py-1.5 rounded-lg bg-neutral-900 text-white whitespace-nowrap"
          >
            Marcar pago
          </button>
        )}
      </div>
    </div>
  );
}
