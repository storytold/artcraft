import { ApiManager } from "./ApiManager.js";
import { v4 as uuidv4 } from "uuid";

export interface Coordinates {
  coordinates: [number, number];
  include: boolean;
}

export interface ObjectData {
  style: {
    color: SegmentationColor;
  };
  object_id: number;
  points: Coordinates[];
}

export type SegmentationColor = [number, number, number];

export interface RequestFrame {
  timestamp: number;
  objects: ObjectData[];
}
export interface ResponseFrame {
  b64_image_data: number;
  idx: number;
  timestamp: number;
  objects: ObjectData[];
  preview_image_url: string;
}

export interface SegmentationRequest {
  session_id: string;
  fps: number;
  frames: RequestFrame[];
  propagate: boolean;
}

export interface SegmentationResponse {
  session_id: string;
  fps: number;
  masked_video_cdn_url: string;
  frames: ResponseFrame[];
  propagate: boolean;
}

export class SegmentationApi extends ApiManager {
  // returns uuid
  public async createSession(
    blobVideo: File | Blob,
  ): Promise<{ session_id: string }> {
    const endpoint = `https://hax.storyteller.ai/segmentation/new_session`;
    const id = uuidv4().toString();
    return this.postFormVideo<{ session_id: "fix-mimetype" }>({
      endpoint: endpoint,
      formRecord: {
        session_id: "fix-mimetype",
      },
      uuid: id,
      blobFileName: id,
      blob: blobVideo,
    });
  }

  public addPointsToSession(
    session_id: string,
    fps: number,
    frames: RequestFrame[],
    propagate: boolean,
  ): Promise<SegmentationResponse> {
    const endpoint = `https://hax.storyteller.ai/segmentation/generate_masks`;

    const segmentationRequest: SegmentationRequest = {
      session_id: session_id,
      fps: fps,
      frames: frames,
      propagate: propagate,
    };

    return this.post<SegmentationRequest, SegmentationResponse>({
      endpoint: endpoint,
      body: segmentationRequest,
    });
  }
}
