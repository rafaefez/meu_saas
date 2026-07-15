import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import OnboardingForm from "./onboarding-form";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { business: true },
  });

  if (user?.business) redirect("/dashboard/agenda");

  return (
    <main className="min-h-screen bg-neutral-50 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-neutral-900">Configure seu negócio</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Leva menos de 2 minutos. Você pode editar tudo depois.
          </p>
        </div>
        <OnboardingForm />
      </div>
    </main>
  );
}
