"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateCustomerNotes(customerId: string, notes: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Não autenticado." };

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) return { error: "Negócio não encontrado." };

  const customer = await db.customer.findUnique({ where: { id: customerId } });
  if (!customer || customer.businessId !== user.business.id) {
    return { error: "Cliente não encontrado." };
  }

  await db.customer.update({ where: { id: customerId }, data: { notes } });
  revalidatePath(`/dashboard/clientes/${customerId}`);
  return { success: true };
}
