import type { Metadata } from "next";
import { PaymentStatus } from "@/components/payment-status";

export const metadata: Metadata = { title: "Payment Successful" };

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      {session_id ? (
        <PaymentStatus sessionId={session_id} />
      ) : (
        <p className="text-center text-slate-500">Missing payment session.</p>
      )}
    </div>
  );
}
