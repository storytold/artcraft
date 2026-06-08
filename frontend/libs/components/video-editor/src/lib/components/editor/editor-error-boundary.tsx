import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "../ui/button";

// Error boundary scoped to the editor subtree. Without this an
// unhandled throw in any descendant (a renderer node, a panel hook
// that touches a torn-down EditorCore, etc.) unwinds through to the
// host shell and the user sees a blank app. The boundary contains
// the blast radius: the editor reports the failure inside its own
// chrome and offers a one-click reload that bumps a child key to
// remount the subtree.
//
// React 18 still requires class components for error boundaries —
// there is no functional equivalent. Keep this component minimal so
// it never throws itself.

interface EditorErrorBoundaryProps {
  children: ReactNode;
  // Called when the user clicks "Reload editor". Host can call
  // EditorCore.reset() and rebootstrap a project. The boundary itself
  // also remounts its children by bumping an internal key.
  onRecover?: () => void;
}

interface EditorErrorBoundaryState {
  error: Error | null;
  // Bumped each time the user recovers so React mounts a fresh
  // subtree instead of replaying the same crashed render.
  retryKey: number;
}

export class EditorErrorBoundary extends Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<EditorErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Logged unconditionally — the user-reported "blank screen" crash
    // currently has no diagnostic; this is the first place an
    // upstream reporter can hook in. componentStack pinpoints which
    // descendant threw.
    console.error("Editor error boundary caught:", error, info.componentStack);
  }

  private handleRecover = (): void => {
    this.props.onRecover?.();
    this.setState((prev) => ({
      error: null,
      retryKey: prev.retryKey + 1,
    }));
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="bg-background flex h-full w-full flex-col items-center justify-center gap-4 p-6">
          <div className="flex max-w-md flex-col items-center gap-2 text-center">
            <h2 className="text-foreground text-base font-semibold">
              The editor ran into a problem
            </h2>
            <p className="text-muted-foreground text-xs">
              {this.state.error.message || "An unexpected error occurred."}
            </p>
            <p className="text-muted-foreground text-[11px]">
              The full error has been logged to the developer console.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={this.handleRecover}>
            Reload editor
          </Button>
        </div>
      );
    }
    // h-full w-full so the keyed remount wrapper doesn't collapse the
    // editor's percentage-height chain — without it the inner shell's
    // `h-full` resolves against an auto-height div and the timeline /
    // panels get ~0px.
    return (
      <div className="h-full w-full" key={this.state.retryKey}>
        {this.props.children}
      </div>
    );
  }
}
