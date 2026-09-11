import { Command, type CommandResult } from "./base-command";

// Groups multiple commands so they undo/redo as a single user-visible
// step. Subcommand `execute` results are folded into the last
// selection-bearing one — useful for "drop multiple elements" flows
// where only the final selection matters. Undo reverses subcommand
// order so dependent state unwinds in the right direction.
export class BatchCommand extends Command {
  constructor(private commands: Command[]) {
    super();
  }

  execute(): CommandResult | undefined {
    let latestSelectionResult: CommandResult | undefined;

    for (const command of this.commands) {
      const result = command.execute();
      if (result?.selection !== undefined) {
        latestSelectionResult = result;
      }
    }

    return latestSelectionResult;
  }

  undo(): void {
    for (const command of [...this.commands].reverse()) {
      command.undo();
    }
  }

  redo(): CommandResult | undefined {
    let latestSelectionResult: CommandResult | undefined;

    for (const command of this.commands) {
      const result = command.redo();
      if (result?.selection !== undefined) {
        latestSelectionResult = result;
      }
    }

    return latestSelectionResult;
  }
}
