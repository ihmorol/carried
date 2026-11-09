"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, BookOpen, Books, Check, List, PencilLine, Quotes, Stamp, Tote } from "@phosphor-icons/react";
import { EditionCard } from "./CardEditions";
import { BookshelfPreview } from "./BookshelfPreview";
import { EDITIONS, SAMPLES, type EditionId, type PreviewLanguage } from "./types";
import type { InkId } from "@/lib/inks";
import "./board.css";

export function DesignBoard() {
  const [language, setLanguage] = useState<PreviewLanguage>("en");
  const [length, setLength] = useState<"short" | "long">("short");
  const [ink, setInk] = useState<InkId>("paper");
  const [edition, setEdition] = useState<EditionId>("bookplate");
  const [name, setName] = useState<string | null>(null);
  const [customQuote, setCustomQuote] = useState<string | null>(null);
  const [stamp, setStamp] = useState(0);
  const [showEditor, setShowEditor] = useState(false);
  const content = { ...SAMPLES[language][length], name: name?.trim() || SAMPLES[language][length].name, quote: customQuote?.trim() || SAMPLES[language][length].quote };
  const selected = EDITIONS.find((item) => item.id === edition)!;

  function changeLanguage(value: PreviewLanguage) {
    setLanguage(value);
    setName(null);
    setCustomQuote(null);
  }

  return (
    <div className="design-board">
      <a className="board-skip" href="#board-main">Skip to design comparison</a>
      <header className="board-header">
        <Link href="/" className="board-brand"><BookOpen size={24} weight="light" aria-hidden="true" /><span>Carried</span></Link>
        <span className="board-preview-label">Design preview</span>
        <Link className="board-back" href="/"><ArrowLeft size={16} aria-hidden="true" />Back to the site</Link>
      </header>
      <main id="board-main">
        <section className="board-introduction" aria-labelledby="board-title">
          <div><h1 id="board-title">A line worth keeping.</h1><p>Three editions. Your words, your name, your stamp.</p></div>
          <p className="board-review-note">A working design study. Your saved cards and the live site haven’t changed.</p>
        </section>

        <section className="board-comparison" aria-label="Compare the card editions">
          <div className="board-toolbar">
            <fieldset><legend>Language</legend><div className="board-segmented">{(["en", "bn"] as const).map((value) => <label key={value} className={language === value ? "is-active" : ""}><input type="radio" name="board-language" value={value} checked={language === value} onChange={() => changeLanguage(value)} /><span>{value === "en" ? "English" : "বাংলা"}</span></label>)}</div></fieldset>
            <fieldset><legend>Sample</legend><div className="board-segmented">{(["short", "long"] as const).map((value) => <label key={value} className={length === value ? "is-active" : ""}><input type="radio" name="board-length" value={value} checked={length === value} onChange={() => { setLength(value); setCustomQuote(null); }} /><span>{value === "short" ? "Short line" : "Long line"}</span></label>)}</div></fieldset>
            <fieldset><legend>Ink</legend><div className="board-inks">{(["paper", "midnight", "moss"] as const).map((value) => <label key={value} className={ink === value ? "is-active" : ""}><input type="radio" name="board-ink" value={value} checked={ink === value} onChange={() => setInk(value)} /><span className={`board-ink-dot board-ink-${value}`} aria-hidden="true" /><span>{value.charAt(0).toUpperCase() + value.slice(1)}</span></label>)}</div></fieldset>
            <button className="board-editor-toggle" type="button" aria-expanded={showEditor} aria-controls="board-word-editor" onClick={() => setShowEditor((value) => !value)}><PencilLine size={18} aria-hidden="true" />Try your words</button>
          </div>
          {showEditor && <div className="board-editor" id="board-word-editor"><label><span>Your line</span><textarea rows={3} value={customQuote ?? content.quote} maxLength={220} onChange={(event) => setCustomQuote(event.target.value)} /></label><label><span>Your name</span><input value={name ?? content.name} maxLength={24} onChange={(event) => setName(event.target.value)} /><small>This preview stays on this page.</small></label></div>}

          <div className="board-edition-grid">
            {EDITIONS.map((item) => <article key={item.id} className={`board-edition${edition === item.id ? " is-selected" : ""}`}>
              <div className={`board-art-stage board-art-stage-${item.id}`}><EditionCard edition={item.id} content={content} ink={ink} stampKey={stamp} /></div>
              <div className="board-edition-caption"><div><h2>{item.name}</h2><p>{item.description}</p></div><button type="button" aria-pressed={edition === item.id} aria-label={`Preview ${item.name} beside the shelf`} onClick={() => setEdition(item.id)}>{edition === item.id ? <Check size={20} aria-hidden="true" /> : <ArrowRight size={20} aria-hidden="true" />}</button></div>
            </article>)}
          </div>
          <div className="board-comparison-footer"><p>The same line and signature in every edition. All digital designs stay free.</p><button type="button" className="board-stamp-action" onClick={() => setStamp((value) => value + 1)}><Stamp size={18} aria-hidden="true" />Stamp the cards</button></div>
        </section>

        <section className="board-room-section" aria-labelledby="board-room-title">
          <div className="board-room-heading"><div><h2 id="board-room-title">The shelf, reimagined.</h2><p>Real covers, room to browse, and a card worth carrying out.</p></div><a href="#room-preview">Explore the preview<ArrowUpRight size={18} aria-hidden="true" /></a></div>
          <div className="board-room" id="room-preview">
            <aside className="board-room-rail" aria-label="Preview navigation"><BookOpen size={25} weight="light" aria-hidden="true" /><a href="#room-preview" aria-label="Shelf preview" className="is-active"><Books size={23} aria-hidden="true" /></a><a href="#room-line" aria-label="Line preview"><Quotes size={23} aria-hidden="true" /></a><Link href="/shop" aria-label="Existing concept shop"><Tote size={23} aria-hidden="true" /></Link><a href="#board-main" className="board-room-menu" aria-label="Back to card comparison"><List size={23} aria-hidden="true" /></a></aside>
            <div className="board-room-shelf"><BookshelfPreview /></div>
            <div className="board-room-line" id="room-line"><div className="board-room-line-heading"><h3>Your next keepsake.</h3><p>{selected.name}, signed by you.</p></div><div className="board-room-card"><EditionCard edition={edition} content={content} ink={ink} stampKey={stamp} /></div><fieldset className="board-room-designs"><legend>Choose an edition</legend>{EDITIONS.map((item) => <label key={item.id} className={edition === item.id ? "is-active" : ""}><input type="radio" name="room-edition" value={item.id} checked={edition === item.id} onChange={() => setEdition(item.id)} />{item.name}</label>)}</fieldset><button type="button" className="board-room-stamp" onClick={() => setStamp((value) => value + 1)}><Stamp size={18} aria-hidden="true" />Make your mark</button><p className="board-room-private">Preview only. Nothing is published or added to your shelf.</p></div>
          </div>
        </section>
        <footer className="board-footer"><p>Choose a design for its composition, not just its color.</p><p>Saving, sharing, and the rest of the app will be connected after your visual review.</p></footer>
      </main>
    </div>
  );
}
