"use client";

import { useState } from "react";
import { track } from "@/lib/analytics";

export function BoostShareCard({
  verseId,
  amountCents,
  versePath,
  shareText,
  reference,
}: {
  verseId: string;
  amountCents: number;
  versePath: string;
  shareText: string;
  reference: string;
}) {
  const [busy, setBusy] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const imageUrl = `/api/share-card?verseId=${verseId}&amount=${amountCents}`;
  const fileName = `bibleRank-${reference.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;

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
    track("share_clicked", { method: "download_card", verse_id: verseId });
    downloadImage();
  }

  function shareToFacebook() {
    const absoluteUrl = `${window.location.origin}${versePath}`;
    track("share_clicked", { method: "facebook", verse_id: verseId, url: absoluteUrl });
    const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(absoluteUrl)}`;
    window.open(fbHref, "_blank", "noopener,noreferrer,width=600,height=650");
  }

  async function shareToInstagram() {
    track("share_clicked", { method: "instagram", verse_id: verseId });
    setBusy(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const file = new File([blob], fileName, { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "BibleRank", text: shareText });
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
    <div className="mt-8">
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={`Shareable card for ${reference}`}
          className="aspect-square w-full"
          width={1080}
          height={1080}
        />
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={handleDownloadClick}
          className="rounded-full border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-400 hover:text-indigo-600"
        >
          {downloaded ? "Downloaded!" : "Download Image"}
        </button>
        <button
          type="button"
          onClick={shareToFacebook}
          className="rounded-full bg-[#1877F2] px-5 py-2 text-sm font-semibold text-white hover:bg-[#0f63d6]"
        >
          Share on Facebook
        </button>
        <button
          type="button"
          onClick={shareToInstagram}
          disabled={busy}
          className="rounded-full bg-gradient-to-tr from-[#feda75] via-[#d62976] to-[#4f5bd5] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          Share to Instagram
        </button>
      </div>
      <p className="mt-2 text-center text-xs text-slate-400">
        On desktop, Instagram sharing downloads the image for you to upload manually.
      </p>
    </div>
  );
}
