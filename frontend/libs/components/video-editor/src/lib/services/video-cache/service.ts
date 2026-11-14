import {
  Input,
  ALL_FORMATS,
  BlobSource,
  CanvasSink,
  type WrappedCanvas,
} from "mediabunny";

// Decoded-frame cache for the preview canvas. mediabunny gives us
// CanvasSink-backed iterators that decode the next frame in sequence;
// we layer two strategies on top:
//
//   - **Forward-prefetch**: while the consumer holds the current frame
//     we eagerly decode the next one so an immediate "now show frame
//     at time + dt" lands without an extra decode round trip.
//   - **Seek-vs-iterate decision**: if the new requested time is
//     reasonably close to where we are (within 2s and >=lastTime), we
//     keep iterating instead of re-seeking — seeking on most codecs
//     means rewinding to a keyframe, which is slow.
//
// The `frameChain` per-media promise queue ensures sequential frame
// requests don't race on the same iterator. `seekGenerations` lets us
// short-circuit stale work when a newer request supersedes one mid-
// flight (e.g. the user is dragging the playhead).

interface VideoSinkData {
  input: Input;
  sink: CanvasSink;
  iterator: AsyncGenerator<WrappedCanvas, void, unknown> | null;
  currentFrame: WrappedCanvas | null;
  nextFrame: WrappedCanvas | null;
  lastTime: number;
  prefetching: boolean;
  prefetchPromise: Promise<void> | null;
}

export class VideoCache {
  private sinks = new Map<string, VideoSinkData>();
  private initPromises = new Map<string, Promise<void>>();
  private frameChain = new Map<string, Promise<unknown>>();
  private seekGenerations = new Map<string, number>();

  async getFrameAt({
    mediaId,
    file,
    time,
  }: {
    mediaId: string;
    file: File;
    time: number;
  }): Promise<WrappedCanvas | null> {
    await this.ensureSink({ mediaId, file });

    const sinkData = this.sinks.get(mediaId);
    if (!sinkData) return null;

    const generation = (this.seekGenerations.get(mediaId) ?? 0) + 1;
    this.seekGenerations.set(mediaId, generation);

    const previous = this.frameChain.get(mediaId) ?? Promise.resolve();
    const current = previous.then(() => {
      if (this.seekGenerations.get(mediaId) !== generation) {
        return sinkData.currentFrame ?? null;
      }
      return this.resolveFrame({ sinkData, time });
    });
    this.frameChain.set(
      mediaId,
      current.catch(() => {}),
    );
    return current;
  }

  clearVideo({ mediaId }: { mediaId: string }): void {
    const sinkData = this.sinks.get(mediaId);
    if (sinkData) {
      if (sinkData.iterator) {
        void sinkData.iterator.return();
      }

      sinkData.input.dispose();
      this.sinks.delete(mediaId);
    }

    this.initPromises.delete(mediaId);
    this.frameChain.delete(mediaId);
    this.seekGenerations.delete(mediaId);
  }

  clearAll(): void {
    for (const [mediaId] of this.sinks) {
      this.clearVideo({ mediaId });
    }
  }

  getStats() {
    return {
      totalSinks: this.sinks.size,
      activeSinks: Array.from(this.sinks.values()).filter((s) => s.iterator)
        .length,
      cachedFrames: Array.from(this.sinks.values()).filter(
        (s) => s.currentFrame,
      ).length,
    };
  }

  private async resolveFrame({
    sinkData,
    time,
  }: {
    sinkData: VideoSinkData;
    time: number;
  }): Promise<WrappedCanvas | null> {
    if (sinkData.nextFrame && sinkData.nextFrame.timestamp <= time) {
      sinkData.currentFrame = sinkData.nextFrame;
      sinkData.nextFrame = null;
      this.startPrefetch({ sinkData });
    }

    if (
      sinkData.currentFrame &&
      this.isFrameValid({ frame: sinkData.currentFrame, time })
    ) {
      if (!sinkData.nextFrame && !sinkData.prefetching) {
        this.startPrefetch({ sinkData });
      }
      return sinkData.currentFrame;
    }

    if (
      sinkData.iterator &&
      sinkData.currentFrame &&
      time >= sinkData.lastTime &&
      time < sinkData.lastTime + 2.0
    ) {
      const frame = await this.iterateToTime({ sinkData, targetTime: time });
      if (frame) {
        if (!sinkData.nextFrame && !sinkData.prefetching) {
          this.startPrefetch({ sinkData });
        }
        return frame;
      }
    }

    const frame = await this.seekToTime({ sinkData, time });
    if (frame && !sinkData.nextFrame && !sinkData.prefetching) {
      this.startPrefetch({ sinkData });
    }
    return frame;
  }

  private isFrameValid({
    frame,
    time,
  }: {
    frame: WrappedCanvas;
    time: number;
  }): boolean {
    return time >= frame.timestamp && time < frame.timestamp + frame.duration;
  }

  private async iterateToTime({
    sinkData,
    targetTime,
  }: {
    sinkData: VideoSinkData;
    targetTime: number;
  }): Promise<WrappedCanvas | null> {
    if (!sinkData.iterator) return null;

    try {
      while (true) {
        if (sinkData.prefetching && sinkData.prefetchPromise) {
          await sinkData.prefetchPromise;
        }

        if (
          sinkData.nextFrame &&
          sinkData.nextFrame.timestamp <= targetTime + 0.05
        ) {
          sinkData.currentFrame = sinkData.nextFrame;
          sinkData.nextFrame = null;
        } else {
          const { value: frame, done } = await sinkData.iterator.next();

          if (done || !frame) break;

          sinkData.currentFrame = frame;
        }

        const frame = sinkData.currentFrame;
        if (!frame) break;

        sinkData.lastTime = frame.timestamp;

        if (this.isFrameValid({ frame, time: targetTime })) {
          return frame;
        }

        if (frame.timestamp > targetTime + 1.0) break;
      }
    } catch (error) {
      console.warn("Iterator failed, will restart:", error);
      sinkData.iterator = null;
    }

    return null;
  }

  private async seekToTime({
    sinkData,
    time,
  }: {
    sinkData: VideoSinkData;
    time: number;
  }): Promise<WrappedCanvas | null> {
    try {
      if (sinkData.prefetching && sinkData.prefetchPromise) {
        await sinkData.prefetchPromise;
      }

      if (sinkData.iterator) {
        await sinkData.iterator.return();
        sinkData.iterator = null;
      }

      sinkData.nextFrame = null;
      sinkData.iterator = sinkData.sink.canvases(time);
      sinkData.lastTime = time;

      const { value: frame } = await sinkData.iterator.next();

      if (frame) {
        sinkData.currentFrame = frame;
        this.startPrefetch({ sinkData });
        return frame;
      }
    } catch (error) {
      console.warn("Failed to seek video:", error);
    }

    return null;
  }

  private startPrefetch({ sinkData }: { sinkData: VideoSinkData }): void {
    if (sinkData.prefetching || !sinkData.iterator || sinkData.nextFrame) {
      return;
    }

    sinkData.prefetching = true;
    sinkData.prefetchPromise = this.prefetchNextFrame({ sinkData });
  }

  private async prefetchNextFrame({
    sinkData,
  }: {
    sinkData: VideoSinkData;
  }): Promise<void> {
    if (!sinkData.iterator) {
      sinkData.prefetching = false;
      sinkData.prefetchPromise = null;
      return;
    }

    try {
      const { value: frame, done } = await sinkData.iterator.next();

      if (done || !frame) {
        sinkData.prefetching = false;
        sinkData.prefetchPromise = null;
        return;
      }

      sinkData.nextFrame = frame;
      sinkData.prefetching = false;
      sinkData.prefetchPromise = null;
    } catch (error) {
      console.warn("Prefetch failed:", error);
      sinkData.prefetching = false;
      sinkData.prefetchPromise = null;
      sinkData.iterator = null;
    }
  }

  private async ensureSink({
    mediaId,
    file,
  }: {
    mediaId: string;
    file: File;
  }): Promise<void> {
    if (this.sinks.has(mediaId)) return;

    if (this.initPromises.has(mediaId)) {
      await this.initPromises.get(mediaId);
      return;
    }

    const initPromise = this.initializeSink({ mediaId, file });
    this.initPromises.set(mediaId, initPromise);

    try {
      await initPromise;
    } finally {
      this.initPromises.delete(mediaId);
    }
  }

  private async initializeSink({
    mediaId,
    file,
  }: {
    mediaId: string;
    file: File;
  }): Promise<void> {
    const input = new Input({
      source: new BlobSource(file),
      formats: ALL_FORMATS,
    });

    try {
      const videoTrack = await input.getPrimaryVideoTrack();
      if (!videoTrack) {
        throw new Error("No video track found");
      }

      const canDecode = await videoTrack.canDecode();
      if (!canDecode) {
        throw new Error("Video codec not supported for decoding");
      }

      const sink = new CanvasSink(videoTrack, {
        poolSize: 3,
        fit: "contain",
      });

      this.sinks.set(mediaId, {
        input,
        sink,
        iterator: null,
        currentFrame: null,
        nextFrame: null,
        lastTime: -1,
        prefetching: false,
        prefetchPromise: null,
      });
    } catch (error) {
      input.dispose();
      console.error(`Failed to initialize video sink for ${mediaId}:`, error);
      throw error;
    }
  }
}

export const videoCache = new VideoCache();
