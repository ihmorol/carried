"use client";

import Link from "next/link";
import { Dialog } from "@base-ui/react/dialog";
import { X, ArrowUpRight } from "@phosphor-icons/react";
import type { RefObject } from "react";
import type { FeaturedPair } from "@/lib/featured-pair";
import { originalName } from "@/lib/books";
import { LineCard } from "./LineCard";
import { ShareRow } from "./ShareRow";
import { TiltCard } from "./TiltCard";
import { useLocale } from "./LocaleProvider";

export default function LineDrawer({ pair, open, onOpenChange, returnFocus }: {
  pair: FeaturedPair;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const { t } = useLocale();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="line-drawer-backdrop" />
        <Dialog.Viewport className="line-drawer-viewport">
          <Dialog.Popup className="line-drawer" finalFocus={returnFocus} aria-modal="true">
            <header className="line-drawer-heading">
              <div>
                <Dialog.Title>{t("hero.detailTitle")}</Dialog.Title>
                <Dialog.Description>{originalName(pair.book)} · {pair.line.n}</Dialog.Description>
              </div>
              <Dialog.Close className="line-drawer-close" aria-label={t("hero.closeDetail")}>
                <X size={24} aria-hidden="true" />
              </Dialog.Close>
            </header>
            <div className="line-drawer-body">
              {/* The pane keeps ≥300px of card width, so the full stage fits
                  without clipping; the mat-less drawer body shows the stack. */}
              <TiltCard land className="line-drawer-stage">
                <LineCard payload={pair.line} id={pair.line.id} book={pair.book} actions={false} />
              </TiltCard>
              <ShareRow payload={pair.line} id={pair.line.id} />
              <div className="line-drawer-links">
                <Link href={`/l/${pair.line.id}`}>{t("hero.openLine")}<ArrowUpRight size={18} aria-hidden="true" /></Link>
                <Link href={`/b/${pair.book.slug}#write`} className="ui-button">{t("nav.write")}</Link>
              </div>
            </div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
