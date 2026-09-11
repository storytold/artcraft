import type { EditorCore } from "../index";
import type { DiagnosticDefinition } from "../../diagnostics/types";

interface DiagnosticRegistration extends DiagnosticDefinition {
  check: (editor: EditorCore) => boolean;
}

// Tracks the set of diagnostic conditions the editor can flag at any
// moment (e.g. "preview won't draw because canvas is too large").
// Registrations carry a check callback which polls the editor's
// current state; getActive runs every check and returns those that
// fire. Cheap to call — the UI re-queries on every render.
export class DiagnosticsManager {
  private readonly registrations: DiagnosticRegistration[] = [];
  private readonly listeners = new Set<() => void>();

  constructor(private editor: EditorCore) {}

  register(registration: DiagnosticRegistration): void {
    this.registrations.push(registration);
    this.notify();
  }

  getActive(options?: { scope?: string }): ReadonlyArray<DiagnosticDefinition> {
    const candidates =
      options?.scope !== undefined
        ? this.registrations.filter((r) => r.scope === options.scope)
        : this.registrations;

    return candidates.filter((r) => r.check(this.editor));
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(): void {
    this.listeners.forEach((listener) => {
      listener();
    });
  }
}
