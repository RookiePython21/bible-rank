"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

type CardVariant = "open" | "resolved-a" | "resolved-b";

function SingleCard({ duelId, variant }: { duelId: string; variant: CardVariant }) {
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const imageUrl = `/api/duels/share-card?duelId=${duelId}&variant=${variant}`;
  const fileName = `bibleRank-duel-${duelId.slice(0, 8)}-${variant}.png`;
  const shareText = "Which speaks to you more, and why? — BibleRank Verse Duel";

  function downloadImage() {
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  function handleDownloadClick() {
    track("share_clicked", { method: "download_card", duel_id: duelId, variant });
    downloadImage();
  }

  function shareToX() {
    track("share_clicked", { method: "x", duel_id: duelId, variant });
    const url = `${window.location.origin}/duel/${duelId}`;
    const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(url)}`;
    window.open(intent, "_blank", "noopener,noreferrer");
  }

  function shareToFacebook() {
    track("share_clicked", { method: "facebook", duel_id: duelId, variant });
    const url = `${window.location.origin}/duel/${duelId}`;
    const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(fbHref, "_blank", "noopener,noreferrer,width=600,height=650");
  }

  async function shareToInstagram() {
    track("share_clicked", { method: "instagram", duel_id: duelId, variant });
    setBusy(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "BibleRank Verse Duel", text: shareText });
        return;
      }
    } catch {
      // Web Share API unavailable, unsupported, or canceled — fall back below.
    } finally {
      setBusy(false);
    }
    downloadImage();
    window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="Verse Duel share card" className="aspect-square w-full" width={1080} height={1080} />
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={handleDownloadClick}
          className="rounded-full border border-slate-300 px-4 py-1.5 text-xs font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
        >
          {downloaded ? "Downloaded!" : "Download"}
        </button>
        <button
          type="button"
          onClick={shareToX}
          className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
        >
          Share on X
        </button>
        <button
          type="button"
          onClick={shareToFacebook}
          className="rounded-full bg-[#1877F2] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#0f63d6]"
        >
          Facebook
        </button>
        <button
          type="button"
          onClick={shareToInstagram}
          disabled={busy}
          className="rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-4 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          Instagram
        </button>
      </div>
    </div>
  );
}

export function DuelShareCard({ duelId, variant }: { duelId: string; variant: "open" | "resolved" }) {
  if (variant === "open") {
    return <SingleCard duelId={duelId} variant="open" />;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <SingleCard duelId={duelId} variant="resolved-a" />
      <SingleCard duelId={duelId} variant="resolved-b" />
    </div>
  );
}
