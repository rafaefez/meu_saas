import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import BookingForm from "./booking-form";

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const business = await db.business.findUnique({
    where: { slug },
    include: { services: true },
  });

  if (!business) return notFound();

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">{business.name}</h1>
          <p className="text-neutral-500 text-sm mt-1">Escolha um serviço e um horário</p>
        </div>
        <BookingForm business={business} services={business.services} />
      </div>
    </main>
  );
}
