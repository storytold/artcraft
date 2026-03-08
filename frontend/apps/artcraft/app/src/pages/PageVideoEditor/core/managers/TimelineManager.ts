import type { VideoEditorCore } from "../EditorCore";
import type {
  TimelineTrack,
  TimelineElement,
  TrackType,
  CreateTimelineElement,
} from "../../types";

export class TimelineManager {
  private listeners = new Set<() => void>();

  constructor(private editor: VideoEditorCore) {}

  getTracks(): TimelineTrack[] {
    return this.editor.scenes.getActiveScene()?.tracks ?? [];
  }

  getTrackById({ trackId }: { trackId: string }): TimelineTrack | null {
    return this.getTracks().find((t) => t.id === trackId) ?? null;
  }

  getTotalDuration(): number {
    const tracks = this.getTracks();
    if (tracks.length === 0) return 0;
    let maxEnd = 0;
    for (const track of tracks) {
      for (const el of track.elements) {
        const end = el.startTime + el.duration;
        if (end > maxEnd) maxEnd = end;
      }
    }
    return maxEnd;
  }

  addTrack({ type, index }: { type: TrackType; index?: number }): string {
    const tracks = [...this.getTracks()];
    const id = `track-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newTrack = this.buildEmptyTrack(id, type);
    if (index !== undefined && index >= 0 && index <= tracks.length) {
      tracks.splice(index, 0, newTrack);
    } else {
      tracks.push(newTrack);
    }
    this.updateTracks(tracks);
    return id;
  }

  removeTrack({ trackId }: { trackId: string }): void {
    const tracks = this.getTracks().filter((t) => t.id !== trackId);
    this.updateTracks(tracks);
  }

  insertElement({
    trackId,
    element,
  }: {
    trackId: string;
    element: CreateTimelineElement;
  }): string {
    const id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fullElement = { ...element, id } as TimelineElement;
    const tracks = this.getTracks().map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        elements: [...track.elements, fullElement],
      } as TimelineTrack;
    });
    this.updateTracks(tracks);
    return id;
  }

  deleteElements({
    elements,
  }: {
    elements: { trackId: string; elementId: string }[];
  }): void {
    const tracks = this.getTracks().map((track) => {
      const toRemove = elements
        .filter((e) => e.trackId === track.id)
        .map((e) => e.elementId);
      if (toRemove.length === 0) return track;
      return {
        ...track,
        elements: track.elements.filter((el) => !toRemove.includes(el.id)),
      } as TimelineTrack;
    });
    this.updateTracks(tracks);
  }

  updateElement({
    trackId,
    elementId,
    updates,
  }: {
    trackId: string;
    elementId: string;
    updates: Partial<TimelineElement>;
  }): void {
    const tracks = this.getTracks().map((track) => {
      if (track.id !== trackId) return track;
      return {
        ...track,
        elements: track.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el,
        ),
      } as TimelineTrack;
    });
    this.updateTracks(tracks);
  }

  moveElement({
    sourceTrackId,
    targetTrackId,
    elementId,
    newStartTime,
  }: {
    sourceTrackId: string;
    targetTrackId: string;
    elementId: string;
    newStartTime: number;
  }): void {
    let movedElement: TimelineElement | null = null;
    let tracks = this.getTracks().map((track) => {
      if (track.id !== sourceTrackId) return track;
      const el = track.elements.find((e) => e.id === elementId);
      if (el) movedElement = { ...el, startTime: Math.max(0, newStartTime) };
      return {
        ...track,
        elements: track.elements.filter((e) => e.id !== elementId),
      } as TimelineTrack;
    });
    if (!movedElement) return;
    tracks = tracks.map((track) => {
      if (track.id !== targetTrackId) return track;
      return {
        ...track,
        elements: [...track.elements, movedElement!],
      } as TimelineTrack;
    });
    this.updateTracks(tracks);
  }

  updateTracks(newTracks: TimelineTrack[]): void {
    this.editor.scenes.updateSceneTracks({ tracks: newTracks });
    this.notify();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  private buildEmptyTrack(id: string, type: TrackType): TimelineTrack {
    const base = { id, name: type.charAt(0).toUpperCase() + type.slice(1) };
    switch (type) {
      case "video":
        return {
          ...base,
          type: "video",
          elements: [],
          isMain: false,
          muted: false,
          hidden: false,
        };
      case "audio":
        return { ...base, type: "audio", elements: [], muted: false };
      case "text":
        return { ...base, type: "text", elements: [], hidden: false };
    }
  }
}
