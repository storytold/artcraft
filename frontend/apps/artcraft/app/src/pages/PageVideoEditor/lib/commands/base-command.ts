export abstract class Command {
  abstract execute(): void;
  undo(): void {
    throw new Error("Undo not implemented for this command");
  }
  redo(): void {
    this.execute();
  }
}
