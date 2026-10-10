import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { EditorHeader } from "./editor-header";
import { SaveManager } from "../../core/managers/save-manager";
import { ProjectManager } from "../../core/managers/project-manager";
import type { EditorCore } from "../../core";
import type { TProject } from "../../project/types";

const host = vi.hoisted(() => ({
  editor: null as unknown as EditorCore,
  navigate: vi.fn(),
  error: vi.fn(),
}));

vi.mock("react-router-dom", () => ({ useNavigate: () => host.navigate }));
vi.mock("../../editor/use-editor", () => ({ useEditor: (selector?: (editor: EditorCore) => unknown) => selector ? selector(host.editor) : host.editor }));
vi.mock("../../EditorProvider", () => ({ useEditorAdapters: () => ({ toast: { error: host.error }, authUser: { currentUser: () => null } }) }));
vi.mock("../../commands/project", () => ({ UpdateProjectSettingsCommand: class {} }));
vi.mock("../../media/rehydrate", () => ({ rehydrateProjectMedia: vi.fn() }));
vi.mock("../ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick, disabled }: { children: ReactNode; onClick: () => void; disabled?: boolean }) => <button onClick={onClick} disabled={disabled}>{children}</button>,
  DropdownMenuSeparator: () => null,
}));
vi.mock("../ui/button", () => ({ Button: ({ children }: { children: ReactNode }) => <button>{children}</button> }));
vi.mock("../../utils/ui", () => ({ cn: (...values: string[]) => values.filter(Boolean).join(" ") }));
vi.mock("./export-button", () => ({ ExportButton: () => null }));
vi.mock("../../actions/shortcuts-dialog", () => ({ ShortcutsDialog: () => null }));
vi.mock("../../project/components/rename-project-dialog", () => ({ RenameProjectDialog: () => null }));
vi.mock("../../project/components/delete-project-dialog", () => ({ DeleteProjectDialog: () => null }));

let root: Root;
let container: HTMLDivElement;
let writes: Array<{ resolve: () => void; reject: (error: Error) => void }>;

beforeEach(async () => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.spyOn(console, "error").mockImplementation(() => {});
  host.navigate.mockReset();
  host.error.mockReset();
  writes = [];
  const editor = {
    adapters: { projectStorage: { saveProject: () => new Promise<void>((resolve, reject) => writes.push({ resolve, reject })) } },
    media: { getAssets: () => [], clearAllAssets: vi.fn() },
    scenes: { clearScenes: vi.fn() }, command: { clear: vi.fn() },
  } as unknown as EditorCore;
  editor.project = new ProjectManager(editor);
  editor.save = new SaveManager({ editor });
  editor.project.setActiveProject({ project: {
    metadata: { id: "draft", name: "Draft", duration: 0, createdAt: new Date(0), updatedAt: new Date(0) },
    scenes: [], currentSceneId: "", version: 1,
    settings: { fps: { numerator: 30, denominator: 1 }, canvasSize: { width: 1920, height: 1080 }, background: { type: "color", color: "#000" } },
  } as TProject });
  host.editor = editor;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () => root.render(<EditorHeader exitTo="/create" />));
});

afterEach(async () => {
  await act(async () => root.unmount());
  host.editor.save.stop();
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("retains an unsaved project and lets the user retry after storage fails", async () => {
  await clickExit();
  await act(async () => writes[0].reject(new Error("disk full")));
  const abandoned = host.navigate.mock.calls.length;
  const retryDisabled = exitButton().disabled;
  expect(host.editor.project.getActive()?.metadata.id).toBe("draft");
  expect(abandoned).toBe(0);
  expect(retryDisabled).toBe(false);
  expect(host.error).toHaveBeenCalledWith("Failed to save project", { description: "disk full" });
  await clickExit();
  expect(writes).toHaveLength(2);
  await act(async () => writes[1].resolve());
  expect(host.editor.project.getActive()).toBeNull();
  expect(host.navigate).toHaveBeenCalledExactlyOnceWith("/create");
});

it("waits for an ordinary successful save before closing and navigating", async () => {
  await clickExit();
  expect(host.navigate).not.toHaveBeenCalled();
  expect(host.editor.project.getActive()?.metadata.id).toBe("draft");
  await act(async () => writes[0].resolve());
  expect(host.editor.project.getActive()).toBeNull();
  expect(host.navigate).toHaveBeenCalledExactlyOnceWith("/create");
  expect(host.error).not.toHaveBeenCalled();
});

it("blocks another exit click while saving", async () => {
  await clickExit();
  expect(exitButton().disabled).toBe(true);
  await clickExit();
  expect(writes).toHaveLength(1);
  await act(async () => writes[0].resolve());
});

function exitButton() {
  return Array.from(container.querySelectorAll("button")).find((button) => button.textContent === "Exit project")!;
}

async function clickExit() {
  await act(async () => exitButton().click());
}
