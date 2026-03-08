import { Command } from "./base-command";

export class BatchCommand extends Command {
  constructor(private commands: Command[]) {
    super();
  }

  execute(): void {
    this.commands.forEach((c) => c.execute());
  }

  undo(): void {
    [...this.commands].reverse().forEach((c) => c.undo());
  }
}
