"use client";

import { useState } from "react";
import { InterpretationForm } from "@/components/interpretation-form";
import { ContributeWidget } from "@/components/contribute-widget";

type Props = {
  verseId: string;
  unlocked: boolean;
  currentTotalCents: number;
  takeFirstDollars: number;
  isCurrentlyFirst: boolean;
  initialAmountDollars?: number;
};

export function CheckoutContributeSection({
  verseId,
  unlocked,
  currentTotalCents,
  takeFirstDollars,
  isCurrentlyFirst,
  initialAmountDollars,
}: Props) {
  const [draftBody, setDraftBody] = useState("");
  const [draftAuthorName, setDraftAuthorName] = useState("");

  return (
    <>
      <div className="mt-6">
        <h2 className="text-sm font-semibold text-slate-900">
          What do you want to share with others about this post?
        </h2>
        <InterpretationForm
          verseId={verseId}
          unlocked={unlocked}
          onDraftChange={(body, authorName) => {
            setDraftBody(body);
            setDraftAuthorName(authorName);
          }}
        />
      </div>

      <div id="contribute" className="mt-6">
        <ContributeWidget
          verseId={verseId}
          currentTotalCents={currentTotalCents}
          takeFirstDollars={takeFirstDollars}
          isCurrentlyFirst={isCurrentlyFirst}
          initialAmountDollars={initialAmountDollars}
          interpretationBody={unlocked ? undefined : draftBody}
          interpretationAuthorName={unlocked ? undefined : draftAuthorName}
          submitLabel="Share your interpretation"
        />
      </div>
    </>
  );
}
