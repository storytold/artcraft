import { CommandResult } from '../common/CommandStatus';
import { Provider } from './Provider';
export interface GetProviderOrderSuccess extends CommandResult {
    payload: GetProviderOrderPayload;
}
export interface GetProviderOrderPayload {
    providers: Provider[];
}
export declare const GetProviderOrder: () => Promise<GetProviderOrderSuccess>;
//# sourceMappingURL=GetProviderOrder.d.ts.map