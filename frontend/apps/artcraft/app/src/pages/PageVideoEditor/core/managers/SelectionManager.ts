type ElementRef = { trackId: string; elementId: string };

export class SelectionManager {
  private selectedElements: ElementRef[] = [];
  private listeners = new Set<() => void>();

  getSelectedElements(): ElementRef[] {
    return this.selectedElements;
  }

  setSelectedElements({ elements }: { elements: ElementRef[] }): void {
    this.selectedElements = elements;
    this.notify();
  }

  clearSelection(): void {
    this.selectedElements = [];
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
