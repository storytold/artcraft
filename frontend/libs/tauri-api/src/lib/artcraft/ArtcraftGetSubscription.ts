import { invoke } from "@tauri-apps/api/core";
import { CommandResult } from "../common/CommandStatus";

export interface ArtcraftGetSubscriptionSuccess extends CommandResult {
  payload: ArtcraftGetSubscriptionPayload;
}

export interface ArtcraftGetSubscriptionPayload {
  active_subscription?: ActiveSubscriptionInfo
}

export interface ActiveSubscriptionInfo {
  subscription_token: string,
  product_slug: string,
  namespace: string,
  next_bill_at?: string,
  subscription_end_at?: string,
}

export const ArtcraftGetSubscription = async () : Promise<ArtcraftGetSubscriptionSuccess> => {
  try {
    return await invoke("storyteller_get_subscription_command") as ArtcraftGetSubscriptionSuccess;
  } catch (error) {
    throw error;
  }
}
