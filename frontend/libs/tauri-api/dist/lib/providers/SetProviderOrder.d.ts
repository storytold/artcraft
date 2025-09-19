import { CommandResult } from '../common/CommandStatus';
import { Provider } from './Provider';
export interface SetProviderOrderRequest {
    providers: Provider[];
}
export declare const SetProviderOrder: (request: SetProviderOrderRequest) => Promise<CommandResult>;
//# sourceMappingURL=SetProviderOrder.d.ts.map