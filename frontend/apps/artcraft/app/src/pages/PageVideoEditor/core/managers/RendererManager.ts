export class RendererManager {
  private renderTree: unknown = null;
  private listeners = new Set<() => void>();

  setRenderTree(tree: unknown): void {
    this.renderTree = tree;
    this.notify();
  }

  getRenderTree(): unknown {
    return this.renderTree;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }
}
