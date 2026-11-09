"use client";

import { useId, useRef, useState } from "react";
import { ArrowRight, Check, MagnifyingGlass, X } from "@phosphor-icons/react";
import "./bookshelf.css";

type ShelfCategory = "Fiction" | "Bangla" | "Ideas";
type CoverDesign = "prince" | "orwell" | "alchemist" | "dune" | "pather" | "bell";

export type CoverBook = {
  slug: string;
  title: string;
  author: string;
  category: ShelfCategory;
  design: CoverDesign;
  imageSrc?: string;
  language?: "en" | "bn";
  searchTerms?: string;
};

// An intentionally small, local collection. These are browsing categories,
// not popularity rankings or a replacement for the production book catalog.
export const PREVIEW_BOOKS: readonly CoverBook[] = [
  {
    slug: "the-little-prince",
    title: "The Little Prince",
    author: "Antoine de Saint-Exupéry",
    category: "Ideas",
    design: "prince",
    imageSrc: "/design-preview/covers/the-little-prince.jpg",
  },
  {
    slug: "1984",
    title: "Nineteen Eighty-Four",
    author: "George Orwell",
    category: "Fiction",
    design: "orwell",
    imageSrc: "/design-preview/covers/1984.jpg",
    searchTerms: "1984 nineteen eighty four",
  },
  {
    slug: "the-alchemist",
    title: "The Alchemist",
    author: "Paulo Coelho",
    category: "Ideas",
    design: "alchemist",
    imageSrc: "/design-preview/covers/the-alchemist.jpg",
  },
  {
    slug: "dune",
    title: "Dune",
    author: "Frank Herbert",
    category: "Fiction",
    design: "dune",
    imageSrc: "/design-preview/covers/dune.jpg",
  },
  {
    slug: "pather-panchali",
    title: "পথের পাঁচালী",
    author: "বিভূতিভূষণ বন্দ্যোপাধ্যায়",
    category: "Bangla",
    design: "pather",
    language: "bn",
    searchTerms: "Pather Panchali Bibhutibhushan Bandyopadhyay Bengali Bangla",
  },
  {
    slug: "the-bell-jar",
    title: "The Bell Jar",
    author: "Sylvia Plath",
    category: "Fiction",
    design: "bell",
  },
];

const FILTERS = ["All books", "Fiction", "Bangla", "Ideas"] as const;
type ShelfFilter = (typeof FILTERS)[number];
const FEATURED_BOOK = PREVIEW_BOOKS[0];

function AuthoredCover({ book }: { book: CoverBook }) {
  // Original geometric cover studies, not reproductions of published editions.
  switch (book.design) {
    case "prince":
      return (
        <span className="cover-preview-art cover-preview-art--prince" aria-hidden="true">
          <span className="cover-preview-author">{book.author}</span>
          <span className="cover-preview-title"><span>The Little</span><span>Prince</span></span>
          <span className="cover-preview-prince-orbit" />
          <span className="cover-preview-prince-planet" />
          <span className="cover-preview-prince-moon" />
        </span>
      );
    case "orwell":
      return (
        <span className="cover-preview-art cover-preview-art--orwell" aria-hidden="true">
          <span className="cover-preview-title">1984</span>
          <span className="cover-preview-orwell-eye"><span /></span>
          <span className="cover-preview-author">{book.author}</span>
        </span>
      );
    case "alchemist":
      return (
        <span className="cover-preview-art cover-preview-art--alchemist" aria-hidden="true">
          <span className="cover-preview-author">{book.author}</span>
          <span className="cover-preview-title"><span>The</span><span>Alchemist</span></span>
          <span className="cover-preview-alchemist-sun" />
          <span className="cover-preview-alchemist-pyramid cover-preview-alchemist-pyramid--back" />
          <span className="cover-preview-alchemist-pyramid" />
        </span>
      );
    case "dune":
      return (
        <span className="cover-preview-art cover-preview-art--dune" aria-hidden="true">
          <span className="cover-preview-author">{book.author}</span>
          <span className="cover-preview-title">Dune</span>
          <span className="cover-preview-dune-sun" />
          <span className="cover-preview-dune-ridge cover-preview-dune-ridge--back" />
          <span className="cover-preview-dune-ridge" />
        </span>
      );
    case "pather":
      return (
        <span className="cover-preview-art cover-preview-art--pather" aria-hidden="true" lang="bn">
          <span className="cover-preview-title"><span>পথের</span><span>পাঁচালী</span></span>
          <span className="cover-preview-pather-path" />
          <span className="cover-preview-pather-field" />
          <span className="cover-preview-author">{book.author}</span>
        </span>
      );
    case "bell":
      return (
        <span className="cover-preview-art cover-preview-art--bell" aria-hidden="true">
          <span className="cover-preview-title"><span>The</span><span>Bell Jar</span></span>
          <span className="cover-preview-bell-vessel"><span /></span>
          <span className="cover-preview-author">{book.author}</span>
        </span>
      );
  }
}

export function FrontCover({
  book,
  className = "",
  featured = false,
}: {
  book: CoverBook;
  className?: string;
  featured?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(book.imageSrc && failedSrc !== book.imageSrc);

  return (
    <span className={`cover-preview ${className}`} data-design={book.design}>
      <span className="cover-preview-book">
        <span className="cover-preview-face">
          {showImage ? (
            // Native images are deliberate in this isolated visual prototype.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="cover-preview-image"
              src={book.imageSrc}
              alt={`${book.title} by ${book.author}, front cover`}
              width={320}
              height={480}
              loading={featured ? "eager" : "lazy"}
              fetchPriority={featured ? "auto" : "low"}
              decoding="async"
              onError={() => setFailedSrc(book.imageSrc ?? null)}
            />
          ) : (
            <span
              className="cover-preview-study"
              role="img"
              aria-label={`${book.title} by ${book.author}, original preview cover`}
            >
              <AuthoredCover book={book} />
            </span>
          )}
        </span>
      </span>
      <span className="cover-preview-caption">{showImage ? "" : "Preview cover"}</span>
    </span>
  );
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function BookshelfPreview({
  onPickBook,
  className = "",
}: {
  onPickBook?: (slug: string) => void;
  className?: string;
}) {
  const id = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<ShelfFilter>("All books");
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const searchWords = normalizeSearch(query).trim().split(/\s+/).filter(Boolean);
  const visibleBooks = PREVIEW_BOOKS.filter((book) => {
    const searchable = normalizeSearch(`${book.title} ${book.author} ${book.slug.replaceAll("-", " ")} ${book.searchTerms ?? ""}`);
    return (filter === "All books" || book.category === filter)
      && searchWords.every((word) => searchable.includes(word));
  });
  const selectedBook = PREVIEW_BOOKS.find((book) => book.slug === selectedSlug);
  const featuredSelected = selectedSlug === FEATURED_BOOK.slug;

  function pickBook(book: CoverBook) {
    setSelectedSlug(book.slug);
    onPickBook?.(book.slug);
  }

  function resetSearch() {
    setQuery("");
    setFilter("All books");
    searchRef.current?.focus();
  }

  return (
    <section className={`bookshelf-preview ${className}`} aria-label="Preview bookshelf">
      <button
        type="button"
        className="bookshelf-feature"
        onClick={() => pickBook(FEATURED_BOOK)}
        aria-label={`Select ${FEATURED_BOOK.title} by ${FEATURED_BOOK.author}`}
        aria-pressed={featuredSelected}
      >
        <span className="bookshelf-feature-cover">
          <FrontCover book={FEATURED_BOOK} featured />
        </span>
        <span className="bookshelf-feature-content">
          <span className="bookshelf-feature-heading">A small book.<br />A long afterlife.</span>
          <span className="bookshelf-feature-copy">Pick a book. Keep what it left in you.</span>
          <span className="bookshelf-feature-action" aria-hidden="true">
            {featuredSelected ? "Book selected" : "Pick this book"}
            {featuredSelected ? <Check size={17} weight="regular" /> : <ArrowRight size={17} weight="regular" />}
          </span>
        </span>
      </button>

      <div className="bookshelf-tools">
        <label className="bookshelf-search-label" htmlFor={`${id}-search`}>Find a book that stays.</label>
        <div className="bookshelf-search-field">
          <MagnifyingGlass size={19} weight="regular" aria-hidden="true" />
          <input
            ref={searchRef}
            id={`${id}-search`}
            className="bookshelf-search-input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title or author"
            autoComplete="off"
            spellCheck={false}
            aria-controls={`${id}-books`}
            aria-describedby={`${id}-collection-note`}
          />
          {query && (
            <button
              type="button"
              className="bookshelf-search-clear"
              aria-label="Clear search"
              onClick={() => {
                setQuery("");
                searchRef.current?.focus();
              }}
            >
              <X size={17} weight="regular" aria-hidden="true" />
            </button>
          )}
        </div>
        <div className="bookshelf-filters" role="group" aria-label="Filter preview books">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              className="bookshelf-filter"
              aria-pressed={filter === item}
              aria-controls={`${id}-books`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div id={`${id}-books`} className="bookshelf-results">
        {visibleBooks.length > 0 ? (
          <ul className="bookshelf-grid" aria-label="Books in the preview collection">
            {visibleBooks.map((book) => {
              const selected = selectedSlug === book.slug;
              return (
                <li key={book.slug} className="bookshelf-book-item">
                  <button
                    type="button"
                    className="bookshelf-book"
                    onClick={() => pickBook(book)}
                    aria-label={`Select ${book.title} by ${book.author}`}
                    aria-pressed={selected}
                  >
                    <span className="bookshelf-book-stage"><FrontCover book={book} /></span>
                    <span className="bookshelf-book-info" lang={book.language ?? "en"}>
                      <span className="bookshelf-book-title">{book.title}</span>
                      <span className="bookshelf-book-author">{book.author}</span>
                    </span>
                    <span className="bookshelf-book-selection" aria-hidden="true">
                      {selected ? <><Check size={12} weight="regular" />Selected</> : <><ArrowRight size={12} weight="regular" />Pick book</>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bookshelf-empty">
            <p className="bookshelf-empty-title">Not on this little shelf.</p>
            <p>Try another title or author, or browse the full preview collection.</p>
            <button type="button" className="bookshelf-reset" onClick={resetSearch}>Show all books<ArrowRight size={16} aria-hidden="true" /></button>
          </div>
        )}
      </div>
      <p className="bookshelf-collection-note" id={`${id}-collection-note`}>A small preview collection. Original cover studies are labeled.</p>
      <p className="bookshelf-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {visibleBooks.length === 1 ? "1 book shown." : `${visibleBooks.length} books shown.`}
        {selectedBook ? ` Selected ${selectedBook.title} by ${selectedBook.author} in this preview.` : ""}
      </p>
    </section>
  );
}
