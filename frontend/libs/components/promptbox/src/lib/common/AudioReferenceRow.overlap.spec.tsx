import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRef, useState } from "react";
import { act, cleanup, render } from "@testing-library/react";

// Shared handle for the toast stand-in (vi.mock calls are lifted above the imports, so it has to come from vi.hoisted).
const m = vi.hoisted(() => ({ toastError: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: m.toastError } }));

import { UploaderStates } from "@storyteller/common";
import type { UploadMediaFn } from "@storyteller/api";
import {
  AudioReferenceRow,
  type AudioReferenceRowHandle,
} from "./AudioReferenceRow";
import type { RefAudio } from "../promptStore";

// How long (in seconds) the stand-in <audio> element reports each file to be, keyed by file name.
const DURATIONS: Record<string, number> = {};

// One in-flight upload the test controls: finish() reports success for it and lets its promise settle, fail() reports
// the upload error the real uploader sends.
interface PendingUpload {
  name: string;
  finish: (token: string) => Promise<void>;
  fail: () => Promise<void>;
}
let pending: PendingUpload[] = [];

// The real uploader talks to the network. This stand-in records each call and leaves it pending until the test decides.
const uploadAudio: UploadMediaFn = vi.fn(
  ({ assetFile, progressCallback }) =>
    new Promise<void>((resolve) => {
      pending.push({
        name: assetFile.name,
        finish: async (token) => {
          await act(async () => {
            progressCallback({ status: UploaderStates.success, data: token });
            resolve();
          });
        },
        fail: async () => {
          await act(async () => {
            progressCallback({
              status: UploaderStates.imageCreateError,
              errorMessage: "boom",
            });
            resolve();
          });
        },
      });
    }),
);

const realCreateElement = document.createElement.bind(document);

beforeEach(() => {
  pending = [];
  vi.mocked(uploadAudio).mockClear();
  m.toastError.mockReset();
  for (const key of Object.keys(DURATIONS)) delete DURATIONS[key];
  // The object URL carries the file name so the fake <audio> below can look its duration up.
  URL.createObjectURL = vi.fn(
    (file: Blob | MediaSource) => `blob:${(file as File).name}`,
  );
  URL.revokeObjectURL = vi.fn();
  // jsdom never loads media, so a real <audio> would never report its length. The row measures a file by making one,
  // setting src and waiting for onloadedmetadata; this stand-in answers from DURATIONS right after src is set.
  vi.spyOn(document, "createElement").mockImplementation(((
    tag: string,
    options?: ElementCreationOptions,
  ) => {
    if (tag !== "audio") return realCreateElement(tag, options);
    const fake: {
      duration: number;
      preload: string;
      currentSrc: string;
      onloadedmetadata: (() => void) | null;
      onerror: (() => void) | null;
    } = {
      duration: 0,
      preload: "",
      currentSrc: "",
      onloadedmetadata: null,
      onerror: null,
    };
    Object.defineProperty(fake, "src", {
      // The measurer reads src back to revoke the object URL, so it needs a getter as well as the setter.
      get() {
        return fake.currentSrc;
      },
      set(value: string) {
        fake.currentSrc = value;
        fake.duration = DURATIONS[value.replace("blob:", "")] ?? 3;
        queueMicrotask(() => fake.onloadedmetadata?.());
      },
    });
    return fake as unknown as HTMLElement;
  }) as typeof document.createElement);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const mp3 = (name: string) => new File(["x"], name, { type: "audio/mpeg" });

// The row's imperative handle: the prompt box's drop/paste code calls addAudioFiles on it with `void`.
const handle = createRef<AudioReferenceRowHandle>();

// The tracks the parent currently holds, kept up to date on every render of the harness below.
let committed: RefAudio[] = [];
const tokens = () => committed.map((a) => a.mediaToken);

// Mounts the row the way the Audio tab does: the committed tracks live in the parent's state and come back in as a
// prop, so a commit only becomes visible to the row after React has re-rendered it.
function Harness({
  max,
  maxSec,
  initial = [],
}: {
  max: number;
  maxSec: number;
  initial?: RefAudio[];
}) {
  const [list, setList] = useState<RefAudio[]>(initial);
  committed = list;
  return (
    <AudioReferenceRow
      ref={handle}
      referenceAudios={list}
      onReferenceAudiosChange={setList}
      maxAudioCount={max}
      maxAudioRefDuration={maxSec}
      uploadAudio={uploadAudio}
    />
  );
}

const setup = (max: number, maxSec = 600, initial: RefAudio[] = []) =>
  render(<Harness max={max} maxSec={maxSec} initial={initial} />);

// Lets timers and microtasks run, so a measurement that is waiting on the (fake) audio element can finish.
const flush = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

// Starts one drop. The batch promise is deliberately NOT awaited: the prompt box calls it with `void`, so the next drop
// can arrive while this one is still uploading.
const drop = async (...names: string[]) => {
  await act(async () => {
    void handle.current!.addAudioFiles(names.map(mp3));
  });
  await flush();
};

// Finishes every upload in the order the uploads started, one at a time, until nothing is left to start or finish. It
// does not care whether the row runs overlapping drops side by side or one after another.
const settleAll = async () => {
  for (let guard = 0; guard < 20; guard++) {
    await flush();
    const next = pending.shift();
    if (!next) return;
    await next.finish(`tok-${next.name}`);
  }
};

describe("a second audio track dropped while the first is still uploading", () => {
  it("does not push the row past the model's track limit", async () => {
    setup(1);
    await drop("a.mp3");
    await drop("b.mp3");
    await settleAll();
    // One slot means one track. The second drop saw the row as still empty (the first track had not landed yet).
    expect(tokens()).toEqual(["tok-a.mp3"]);
  });

  it("does not push the row past the total duration cap", async () => {
    DURATIONS["a.mp3"] = 6;
    DURATIONS["b.mp3"] = 6;
    setup(3, 10);
    await drop("a.mp3");
    await drop("b.mp3");
    await settleAll();
    // 6s + 6s is over the 10s cap, but each drop measured itself against an empty row.
    expect(tokens()).toEqual(["tok-a.mp3"]);
    expect(m.toastError).toHaveBeenCalledWith(
      "Total audio duration cannot exceed 10s",
    );
  });

  it("keeps showing the uploading state until the second track is done too", async () => {
    const { queryByText } = setup(3);
    await drop("a.mp3");
    await drop("b.mp3");
    expect(queryByText("Uploading…")).not.toBeNull();
    // The first track lands; the second is still in flight (or waiting for its turn).
    await pending.shift()!.finish("tok-a.mp3");
    await flush();
    expect(queryByText("Uploading…")).not.toBeNull();
    expect(queryByText("Add audio")).toBeNull();
    await settleAll();
    expect(queryByText("Uploading…")).toBeNull();
  });

  it("control: both tracks end up in the row when there is room for both", async () => {
    setup(3);
    await drop("a.mp3");
    await drop("b.mp3");
    await settleAll();
    expect(tokens()).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });
});

describe("audio drops that do not overlap", () => {
  it("control: a single drop adds the track", async () => {
    setup(2);
    await drop("a.mp3");
    await settleAll();
    expect(tokens()).toEqual(["tok-a.mp3"]);
  });

  it("control: a second drop after the first finished adds a second track", async () => {
    setup(2);
    await drop("a.mp3");
    await settleAll();
    await drop("b.mp3");
    await settleAll();
    expect(tokens()).toEqual(["tok-a.mp3", "tok-b.mp3"]);
  });

  it("control: several files in one drop are added in order", async () => {
    setup(3);
    await drop("a.mp3", "b.mp3", "c.mp3");
    await settleAll();
    expect(tokens()).toEqual(["tok-a.mp3", "tok-b.mp3", "tok-c.mp3"]);
  });

  it("control: a full row uploads nothing", async () => {
    const full: RefAudio = {
      id: "x",
      url: "blob:x",
      file: mp3("x.mp3"),
      mediaToken: "tok-x",
      duration: 3,
    };
    setup(1, 600, [full]);
    await drop("a.mp3");
    await settleAll();
    expect(uploadAudio).not.toHaveBeenCalled();
    expect(tokens()).toEqual(["tok-x"]);
  });

  it("control: a failed upload clears the uploading state and tells the user", async () => {
    const { queryByText } = setup(2);
    await drop("a.mp3");
    expect(queryByText("Uploading…")).not.toBeNull();
    await pending.shift()!.fail();
    await flush();
    expect(queryByText("Uploading…")).toBeNull();
    expect(queryByText("Add audio")).not.toBeNull();
    expect(m.toastError).toHaveBeenCalledWith(
      "Audio upload failed. Please try again.",
    );
    expect(tokens()).toEqual([]);
  });
});
