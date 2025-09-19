export declare enum CommandSuccessStatus {
    Success = "success"
}
export declare enum CommandErrorStatus {
    BadRequest = "bad_request",
    Unauthorized = "unauthorized",
    ServerError = "server_error"
}
export type CommandStatus = CommandSuccessStatus | CommandErrorStatus;
export interface CommandResult {
    status: CommandStatus;
}
//# sourceMappingURL=CommandStatus.d.ts.map