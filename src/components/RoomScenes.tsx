import type { ReactNode } from "react";

/** Closed cloth volumes and shelf planes, not additional content or controls. */
function ClosedVolume({ className = "" }: { className?: string }) {
  return (
    <span className={`room-volume ${className}`}>
      <span className="room-volume-back" />
      <span className="room-volume-pages" />
      <span className="room-volume-cover"><span /></span>
      <span className="room-volume-spine" />
    </span>
  );
}

function LibraryBay() {
  return (
    <div className="library-bay">
      <div className="library-bay-arch" />
      <div className="library-bay-row library-bay-row--upper">
        <i /><i /><i /><i /><i /><i /><i />
      </div>
      <div className="library-bay-row library-bay-row--lower">
        <i /><i /><i /><i /><i /><i />
      </div>
      <div className="library-bay-plinth" />
    </div>
  );
}

export function BookScene({ children }: { children: ReactNode }) {
  return (
    <div className="book-scene" data-room-scene data-in-view="false">
      <div className="book-scene-setting" aria-hidden="true">
        <LibraryBay />
        <span className="book-scene-floor" />
        <span className="book-scene-shadow room-ambient" />
        <div className="book-scene-stack">
          <ClosedVolume className="room-volume--lower" />
          <ClosedVolume className="room-volume--upper room-ambient" />
        </div>
      </div>
      <div className="book-scene-feature">{children}</div>
    </div>
  );
}

export function CardScene({ children }: { children: ReactNode }) {
  return (
    <div className="card-scene" data-room-scene data-in-view="false">
      <div className="card-scene-setting" aria-hidden="true">
        <span className="card-scene-paper" />
        <ClosedVolume className="card-scene-volume room-ambient" />
        <span className="card-scene-bookend" />
      </div>
      <div className="card-scene-art">{children}</div>
    </div>
  );
}

export function LibraryFooter() {
  return (
    <div className="room-library-footer" aria-hidden="true">
      <span /><span /><span /><span /><span /><span /><span /><span /><span />
    </div>
  );
}
