// Per-event-type pub/sub for EngineEvent. Mirrors Chromium's
// EventListenerMap: each event class has its own listener set, and
// emit() walks only that set — no global fan-out, no instanceof
// chains in subscribers. We key by constructor reference instead of
// the DOM's string `type` because identity is faster than string
// hashing and we have no user-visible type strings to intern.
//
// emit() iterates the Set directly. ES Set iteration is well-defined
// under concurrent add/delete (deleted entries skipped, added entries
// visited later in the same iteration) — fine for our engine, since
// no current subscriber self-modifies the listener set mid-dispatch.

import type { EngineEvent } from "./EngineEvent";

export type EngineEventCtor<T extends EngineEvent = EngineEvent> = new (
  ...args: never[]
) => T;

export type EngineEventListener<T extends EngineEvent = EngineEvent> = (
  event: T,
) => void;

export class EngineEventBus {
  private byCtor = new Map<
    EngineEventCtor,
    Set<EngineEventListener<EngineEvent>>
  >();

  subscribe<T extends EngineEvent>(
    ctor: EngineEventCtor<T>,
    listener: EngineEventListener<T>,
  ): () => void {
    let set = this.byCtor.get(ctor);
    if (!set) {
      set = new Set();
      this.byCtor.set(ctor, set);
    }
    const erased = listener as EngineEventListener<EngineEvent>;
    set.add(erased);
    return () => {
      set!.delete(erased);
    };
  }

  emit<T extends EngineEvent>(event: T): void {
    const set = this.byCtor.get(event.constructor as EngineEventCtor);
    if (!set) return;
    for (const fn of set) fn(event);
  }
}
