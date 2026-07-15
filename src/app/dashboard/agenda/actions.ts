"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function updateAppointmentStatus(
  appointmentId: string,
  status: "cancelado" | "concluido" | "confirmado"
) {
  const { userId } = await auth();
  if (!userId) return { error: "Não autenticado." };

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });
  if (!user?.business) return { error: "Negócio não encontrado." };

  const appointment = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.businessId !== user.business.id) {
    return { error: "Agendamento não encontrado." };
  }

  await db.appointment.update({ where: { id: appointmentId }, data: { status } });
  revalidatePath("/dashboard/agenda");
  return { success: true };
}
