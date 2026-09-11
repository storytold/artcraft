import { invoke } from "@tauri-apps/api/core";
import type {
  OmniGenAudioRequest,
  OmniGenAudioGenerateResponse,
  OmniGenAudioCostResponse,
  OmniGenMeshRequest,
  OmniGenMeshGenerateResponse,
  OmniGenMeshCostResponse,
  OmniGenSplatRequest,
  OmniGenSplatGenerateResponse,
} from "@storyteller/api";
import type { GenerationProvider } from "@storyteller/api-enums";
import { CommandSuccessStatus } from "../common/CommandStatus";

export type OmniCommandRequest<T> = T & {
  provider?: GenerationProvider;
  frontend_caller?: string;
  frontend_subscriber_id?: string;
  frontend_subscriber_payload?: string;
};

export interface OmniCommandSuccess<T> {
  status: CommandSuccessStatus.Success;
  payload: T;
}

// Model IDs and options are API strings; there is no desktop enum conversion.
export const GenerateAudio = <T extends OmniGenAudioRequest>(
  request: OmniCommandRequest<T>,
) =>
  invoke<OmniCommandSuccess<OmniGenAudioGenerateResponse>>(
    "generate_audio_command",
    { request },
  );

export const GenerateMesh = <T extends OmniGenMeshRequest>(
  request: OmniCommandRequest<T>,
) =>
  invoke<OmniCommandSuccess<OmniGenMeshGenerateResponse>>(
    "generate_mesh_command",
    { request },
  );

export const GenerateSplat = <T extends OmniGenSplatRequest>(
  request: OmniCommandRequest<T>,
) =>
  invoke<OmniCommandSuccess<OmniGenSplatGenerateResponse>>(
    "generate_splat_command",
    { request },
  );

export const EstimateAudioCost = <T extends OmniGenAudioRequest>(
  request: OmniCommandRequest<T>,
) =>
  invoke<OmniCommandSuccess<OmniGenAudioCostResponse>>(
    "estimate_audio_cost_command",
    { request },
  );

export const EstimateMeshCost = <T extends OmniGenMeshRequest>(
  request: OmniCommandRequest<T>,
) =>
  invoke<OmniCommandSuccess<OmniGenMeshCostResponse>>(
    "estimate_mesh_cost_command",
    { request },
  );
