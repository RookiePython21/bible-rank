import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-slate-600 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-2 text-sm text-slate-400">
        Placeholder privacy policy — replace with counsel-reviewed policy before public launch.
      </p>

      <div className="mt-6 space-y-4">
        <p>
          BibleRank does not require an account to browse the leaderboard or contribute to a
          verse. We collect the minimum data needed to operate the Service:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong className="text-slate-900">Payment data:</strong> handled entirely by
            Stripe. BibleRank never receives or stores your card number. We store Stripe
            identifiers (checkout session ID, payment intent ID) and the contribution amount to
            maintain the public leaderboard and financial records.
          </li>
          <li>
            <strong className="text-slate-900">Search queries:</strong> logged for product
            analytics (which phrases lead to which verses). Queries are not linked to payment
            information.
          </li>
          <li>
            <strong className="text-slate-900">Basic usage analytics:</strong> page views and
            product events (e.g. leaderboard views, searches, contributions started/completed) to
            understand how the Service is used.
          </li>
        </ul>
        <p>
          Contribution amounts and the verse they support are public by design — that is the
          leaderboard. We do not publicly display the identity of who made a contribution unless
          identity functionality is intentionally added in the future.
        </p>
        <p>
          We do not sell personal data. Third-party processors (Stripe for payments, Supabase for
          data storage, our embedding provider for search) process data only as needed to operate
          the Service.
        </p>
        <p>Questions about this policy can be sent to the contact address listed on this site.</p>
      </div>
    </div>
  );
}
