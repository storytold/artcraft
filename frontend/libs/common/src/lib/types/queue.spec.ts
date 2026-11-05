import { describe, expect, it, vi } from "vitest";
import queue from "./queue";
import { QueueNames } from "../enums";

// Cast: the action/data values are irrelevant to routing, so use plain strings.
const publish = (queueName: QueueNames, action: string) =>
  queue.publish({ queueName, action: action as never, data: null });

describe("queue", () => {
  it("buffers messages published before any subscriber and replays them in order", () => {
    publish(QueueNames.TO_TIMELINE, "a");
    publish(QueueNames.TO_TIMELINE, "b");
    const handler = vi.fn();
    queue.subscribe(QueueNames.TO_TIMELINE, "late", handler);
    expect(handler.mock.calls.map(([e]) => e.action)).toEqual(["a", "b"]);
  });

  it("delivers directly once subscribed and does not replay twice", () => {
    const handler = vi.fn();
    queue.subscribe(QueueNames.TO_ENGINE, "live", handler);
    publish(QueueNames.TO_ENGINE, "x");
    expect(handler).toHaveBeenCalledTimes(1);
    const second = vi.fn();
    queue.subscribe(QueueNames.TO_ENGINE, "second", second);
    expect(second).not.toHaveBeenCalled();
  });
});
