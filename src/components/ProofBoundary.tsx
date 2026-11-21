"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode; resetKey: string; message: string; retryLabel: string };
type State = { failed: boolean; resetKey: string };

/** Only disposable proof rendering belongs inside this boundary. The editor
 * and its raw draft stay mounted above it, including when a proof is retried. */
export class ProofBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> { return { failed: true }; }
  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="composer-proof-fallback panel p-4">
      <p role="status" className="text-sm text-[var(--color-ink-soft)]">{this.props.message}</p>
      <button type="button" onClick={() => this.setState({ failed: false })} className="ui-button-secondary mt-3">{this.props.retryLabel}</button>
    </div>;
  }
}
