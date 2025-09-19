

export enum CommandSuccessStatus {
  Success = "success",
}

export enum CommandErrorStatus {
  BadRequest = "bad_request",
  Unauthorized = "unauthorized",
  ServerError = "server_error",
}

export type CommandStatus = CommandSuccessStatus | CommandErrorStatus;

export interface CommandResult {
  status: CommandStatus;
}
