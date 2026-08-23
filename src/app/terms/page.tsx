import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-slate-600 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-slate-400">
        Placeholder terms — replace with counsel-reviewed terms before public launch.
      </p>

      <div className="mt-6 space-y-4">
        <p>
          BibleRank (&ldquo;the Service&rdquo;) is a public leaderboard of Bible verses. Users
          may search for and select canonical Bible verses from the World English Bible (WEB)
          and contribute money to increase a verse&apos;s public total. Rank on the leaderboard
          is determined solely by completed contributions.
        </p>
        <p>
          <strong className="text-slate-900">Contributions are not purchases.</strong>{" "}
          A contribution increases the public leaderboard total associated with a Bible
          reference. It does not grant ownership of a verse, Scripture text, or any rights beyond
          being reflected in that verse&apos;s public total.
        </p>
        <p>
          <strong className="text-slate-900">No refunds, except as required by law or at our
          discretion.</strong> Contributions are generally final. If a payment is refunded through
          Stripe, the corresponding amount is deducted from the verse&apos;s public total; the
          original contribution record is retained for financial integrity.
        </p>
        <p>
          <strong className="text-slate-900">No theological endorsement.</strong> Rankings
          reflect user financial support only and do not imply theological authority, doctrinal
          correctness, or that higher-ranked verses are objectively more important Scripture.
        </p>
        <p>
          You must be able to form a binding contract to contribute (typically 18+, or the age of
          majority in your jurisdiction). Payments are processed by Stripe; your payment
          information is handled by Stripe and is never stored by BibleRank.
        </p>
        <p>
          We may modify or discontinue the Service at any time. These Terms may be updated; the
          current version is always available at this URL.
        </p>
        <p>Questions about these Terms can be sent to the contact address listed on this site.</p>
      </div>
    </div>
  );
}
