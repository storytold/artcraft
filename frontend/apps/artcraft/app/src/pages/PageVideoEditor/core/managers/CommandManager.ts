import type { Command } from "../../lib/commands";

export class CommandManager {
  private history: Command[] = [];
  private redoStack: Command[] = [];
  private listeners = new Set<() => void>();

  execute({ command }: { command: Command }): Command {
    command.execute();
    this.history.push(command);
    this.redoStack = [];
    this.notify();
    return command;
  }

  push({ command }: { command: Command }): void {
    this.history.push(command);
    this.redoStack = [];
    this.notify();
  }

  undo(): void {
    if (this.history.length === 0) return;
    const command = this.history.pop();
    command?.undo();
    if (command) this.redoStack.push(command);
    this.notify();
  }

  redo(): void {
    if (this.redoStack.length === 0) return;
    const command = this.redoStack.pop();
    command?.redo();
    if (command) this.history.push(command);
    this.notify();
  }

  canUndo(): boolean {
    return this.history.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.history = [];
    this.redoStack = [];
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
