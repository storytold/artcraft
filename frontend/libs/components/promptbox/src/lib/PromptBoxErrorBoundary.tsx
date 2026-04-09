import { Component, Fragment } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  resetKey: number;
}

export class PromptBoxErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: 0 };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("PromptBox crashed:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-sm text-red-300">
          <span>Something went wrong with the prompt box.&nbsp;</span>
          <button
            className="underline hover:text-red-200"
            onClick={() =>
              this.setState((prev) => ({
                hasError: false,
                resetKey: prev.resetKey + 1,
              }))
            }
          >
            Try again
          </button>
        </div>
      );
    }
    return (
      <Fragment key={this.state.resetKey}>{this.props.children}</Fragment>
    );
  }
}
