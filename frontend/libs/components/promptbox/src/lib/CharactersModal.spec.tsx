// CharactersModal.spec: checks the "Creating..." card that shows while a new character is being made.
// Making a character is slow on the server: the create call returns at once, but the character only appears in the
// account's list a while later. The modal shows a "Creating..." card for it and re-reads the list until it shows up.
// The card is matched to the new character by NAME, and the app lets several characters share a name (PromptBoxVideo
// resolves "@Alex" to the newest one), so a second "Alex" must not be treated as finished just because an older
// "Alex" is already in the list. The modal's children (gallery, preview, buttons, inputs) are replaced with plain
// stand-ins; the real modal logic, character store and timers run.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  listAll: vi.fn(),
  create: vi.fn(),
  upload: vi.fn(),
}));

vi.mock("@storyteller/api", () => ({
  CharactersApi: class {
    ListAllCharacters = m.listAll;
    CreateCharacter = m.create;
  },
  MediaUploadApi: class {
    UploadImage = m.upload;
  },
}));
vi.mock("@storyteller/tauri-api", () => ({ downloadFileFromUrl: vi.fn() }));
vi.mock("@storyteller/ui-toaster", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock("@storyteller/ui-gallery-modal", () => ({ GalleryModal: () => null }));
vi.mock("./deck/DeckCard", () => ({ DeckPreviewModal: () => null }));
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: unknown }) =>
    isOpen ? <div>{children as never}</div> : null,
}));
vi.mock("@storyteller/ui-input", () => ({
  Input: ({ id, value, onChange, placeholder }: Record<string, never>) => (
    <input id={id} value={value} onChange={onChange} placeholder={placeholder} />
  ),
}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick, disabled }: Record<string, never>) => (
    <button onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
}));
vi.mock("@storyteller/ui-label", () => ({
  Label: ({ children, htmlFor }: Record<string, never>) => <label htmlFor={htmlFor}>{children}</label>,
}));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  showActionReminder: vi.fn(),
  isActionReminderOpen: { value: false },
  actionReminderProps: { value: null },
}));

import { CharactersModal } from "./CharactersModal";
import { useCharactersStore } from "./promptStore";

// The store as it was when the file loaded, so each test starts clean.
const initialCharacters = useCharactersStore.getState();

// A character as the server's list returns it.
const serverCharacter = (token: string, name: string) => ({
  token,
  name,
  is_user_created: true,
  maybe_avatar: { cdn_url: `https://cdn.example/${token}.png` },
});

// Open the modal, go to "Create New", fill in a name, upload a picture and press Create.
const createCharacterNamed = async (name: string) => {
  const view = render(<CharactersModal isOpen onClose={() => undefined} />);
  await act(async () => {});
  fireEvent.click(view.getByText("Create New"));
  fireEvent.change(view.getByPlaceholderText("Character name"), { target: { value: name } });
  const fileInput = view.container.querySelector('input[type="file"]') as HTMLInputElement;
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [new File(["x"], "ref.png", { type: "image/png" })] } });
  });
  await act(async () => {});
  await act(async () => {
    fireEvent.click(view.getByRole("button", { name: "Create" }));
  });
  await act(async () => {});
  return view;
};

describe("CharactersModal Creating card", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setInterval", "clearInterval"] });
    m.listAll.mockReset();
    m.create.mockReset();
    m.upload.mockReset();
    m.create.mockResolvedValue({ success: true, data: "job_1" });
    m.upload.mockResolvedValue({ success: true, data: "mf_ref" });
    useCharactersStore.setState(initialCharacters, true);
    URL.createObjectURL = vi.fn(() => "blob:ref");
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("keeps the card while only an older character with the same name is in the list", async () => {
    // The server still lists just the old "Alex"; the new one is not finished yet.
    m.listAll.mockResolvedValue({ success: true, data: [serverCharacter("char_old", "Alex")] });
    const view = await createCharacterNamed("Alex");
    expect(view.queryByText("Creating...")).not.toBeNull();
  });

  it("clears the card once a new character with that name shows up in the list", async () => {
    m.listAll.mockResolvedValue({ success: true, data: [serverCharacter("char_old", "Alex")] });
    const view = await createCharacterNamed("Alex");
    // The new character finishes: the next poll sees two "Alex" characters.
    m.listAll.mockResolvedValue({
      success: true,
      data: [serverCharacter("char_new", "Alex"), serverCharacter("char_old", "Alex")],
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    await act(async () => {});
    expect(view.queryByText("Creating...")).toBeNull();
    // The mention store now knows the new token, so "@Alex" can resolve to it.
    const tokens = useCharactersStore.getState().characters.map((c) => c.character_token);
    expect(tokens).toContain("char_new");
  });

  it("keeps the card for a brand-new name until it is listed, then clears it", async () => {
    m.listAll.mockResolvedValue({ success: true, data: [serverCharacter("char_old", "Alex")] });
    const view = await createCharacterNamed("Blake");
    expect(view.queryByText("Creating...")).not.toBeNull();
    m.listAll.mockResolvedValue({
      success: true,
      data: [serverCharacter("char_blake", "Blake"), serverCharacter("char_old", "Alex")],
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });
    await act(async () => {});
    expect(view.queryByText("Creating...")).toBeNull();
  });
});
