"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

async function getOwnedTransaction(transactionId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Não autenticado." } as const;

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) return { error: "Negócio não encontrado." } as const;

  const tx = await db.transaction.findUnique({ where: { id: transactionId } });
  if (!tx || tx.businessId !== user.business.id) {
    return { error: "Registro não encontrado." } as const;
  }
  return { tx } as const;
}

export async function markTransactionPaid(
  transactionId: string,
  method: "pix" | "dinheiro" | "cartao"
) {
  const result = await getOwnedTransaction(transactionId);
  if ("error" in result) return result;

  await db.transaction.update({
    where: { id: transactionId },
    data: { status: "pago", method },
  });
  revalidatePath("/dashboard/financeiro");
  return { success: true };
}

export async function markTransactionPending(transactionId: string) {
  const result = await getOwnedTransaction(transactionId);
  if ("error" in result) return result;

  await db.transaction.update({
    where: { id: transactionId },
    data: { status: "pendente" },
  });
  revalidatePath("/dashboard/financeiro");
  return { success: true };
}
