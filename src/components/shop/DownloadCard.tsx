"use client";
import { useState } from "react";
import { ArrowDown, Check } from "@phosphor-icons/react/dist/ssr";
import { exportLineCard } from "@/lib/canvas";
import { useShopCopy } from "@/lib/commerce/copy";
import { validateSelection, type Selection } from "@/lib/commerce/personalization";

export function DownloadCard({ selection }: { selection: Selection }) {
  const { c } = useShopCopy();
  const [status, setStatus] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function download() {
    setStatus("busy");
    try {
      const valid = validateSelection(selection);
      const blob = await exportLineCard(valid.payload, valid.sourceId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url; anchor.download = `carried-${valid.payload.b}-${valid.payload.s}.png`;
      document.body.appendChild(anchor); anchor.click(); anchor.remove();
      // Keep the blob alive until the browser has accepted the download.
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setStatus("done");
    } catch { setStatus("error"); }
  }
  return <div className="shop-download">
    <button type="button" className="ui-button ui-button-secondary" disabled={status === "busy"} onClick={download}>
      {status === "done" ? <Check size={18} aria-hidden /> : <ArrowDown size={18} aria-hidden />}
      {c(status === "busy" ? "downloading" : "download")}
    </button>
    {status === "error" && <p className="shop-error" role="alert">{c("downloadError")}</p>}
    {status === "done" && <p className="shop-note" role="status">{c("downloaded")}</p>}
  </div>;
}
