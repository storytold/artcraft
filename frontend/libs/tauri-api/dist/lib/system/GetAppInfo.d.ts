import { CommandResult } from '../common/CommandStatus';
export interface GetAppInfoSuccess extends CommandResult {
    payload: GetAppInfoPayload;
}
export interface GetAppInfoPayload {
    artcraft_version: string;
    build_timestamp: string;
    git_commit_id?: string | null;
    git_commit_short_id?: string | null;
    git_commit_timestamp?: string | null;
    storyteller_host?: string | null;
    os_platform?: string | null;
    os_version?: string | null;
}
export declare const GetAppInfo: () => Promise<GetAppInfoSuccess>;
//# sourceMappingURL=GetAppInfo.d.ts.map