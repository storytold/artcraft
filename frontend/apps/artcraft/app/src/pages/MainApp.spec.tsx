import { StrictMode } from "react";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MainApp } from "./MainApp";

const { getSession, triggerRecheck, authentication, user } = vi.hoisted(() => ({
  getSession: vi.fn(),
  triggerRecheck: vi.fn(),
  authentication: {
    status: { value: "INIT" },
    userInfo: { value: null as unknown },
  },
  user: { username: "synthetic_user", user_token: "u_synthetic_identifier" },
}));

// Keep the shell mounted without starting background jobs, native listeners,
// or editors. Authentication initialization belongs to the root/login modal;
// this test observes only requests added by MainApp itself.
vi.mock("@preact/signals-react/runtime", () => ({ useSignals: vi.fn() }));
vi.mock("~/hooks/useActiveJobs", () => ({ useActiveJobs: vi.fn() }));
vi.mock("~/hooks/useBackgroundLoadingMedia", () => ({
  useBackgroundLoadingMedia: vi.fn(),
}));
vi.mock("@storyteller/tauri-events", () => ({
  useGenerationEnqueueSuccessEvent: vi.fn(),
  useGenerationEnqueueFailureEvent: vi.fn(),
  useGenerationCompleteEvent: vi.fn(),
  useGenerationFailedEvent: vi.fn(),
  useTextToImageGenerationCompleteEvent: vi.fn(),
  useFlashUserInputErrorEvent: vi.fn(),
  useFlashFileDownloadErrorEvent: vi.fn(),
  useMediaFileDeletedEvent: vi.fn(),
}));
vi.mock("~/Classes/ApiManager", () => ({
  UsersApi: class {
    GetSession = getSession;
  },
}));
vi.mock("~/signals", () => ({ authentication }));
vi.mock("~/enums", () => ({ AUTH_STATUS: { LOGGED_IN: "LOGGED_IN" } }));
vi.mock("~/components", () => ({
  TopBar: ({ loginSignUpPressed }: { loginSignUpPressed: () => void }) => (
    <button onClick={loginSignUpPressed}>Log in</button>
  ),
  ErrorDialog: () => null,
}));
vi.mock("@storyteller/ui-login-modal", () => ({
  useLoginModalStore: () => ({ triggerRecheck }),
  LoginModal: ({
    onArtCraftAuthSuccess,
  }: {
    onArtCraftAuthSuccess: (value: typeof user) => void;
  }) => (
    <button onClick={() => onArtCraftAuthSuccess(user)}>Complete login</button>
  ),
}));
vi.mock("@storyteller/ui-toaster", () => ({
  toast: { error: vi.fn() },
  Toaster: () => null,
}));
vi.mock("@storyteller/ui-gallery-modal", () => ({
  GalleryDragComponent: () => null,
  onImageDrop: vi.fn(),
  removeImageDropListener: vi.fn(),
}));
vi.mock("@storyteller/ui-pricing-modal", () => ({
  PricingModal: () => null,
  CreditsModal: () => null,
  useCreditsModalStore: () => ({ isOpen: false, closeModal: vi.fn() }),
}));
vi.mock("@storyteller/ui-action-reminder-modal", () => ({
  isActionReminderOpen: { value: false },
  actionReminderProps: { value: null },
  ActionReminderModal: () => null,
}));
vi.mock("@storyteller/soundboard", () => ({
  SoundManager: { playFileDeleted: vi.fn() },
}));
vi.mock("@storyteller/ui-settings-modal", () => ({
  useStoryboardPageEnabled: () => false,
}));
vi.mock("@storyteller/ui-pagescene", () => ({
  DomLevels: { DIALOGUE: 1 },
  usePageSceneStore: () => vi.fn(),
}));
vi.mock("./Stores/TabState", () => ({ useTabStore: () => "APPS" }));
vi.mock("./PageImage/TextToImageStore", () => ({
  useTextToImageStore: () => vi.fn(),
}));
vi.mock("./PageApps/AppsIndexPage", () => ({
  AppsIndexPage: () => <div>Apps</div>,
}));
vi.mock("./PageDraw/PageDraw", () => ({ default: () => null }));
vi.mock("~/components/signaled/TopBar/TopBar", () => ({
  topNavMediaId: { value: null },
  topNavMediaUrl: { value: null },
}));

beforeEach(() => {
  vi.clearAllMocks();
  getSession.mockResolvedValue({
    success: true,
    data: { loggedIn: true, user },
  });
  authentication.status.value = "INIT";
  authentication.userInfo.value = null;
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("MainApp authentication boundary", () => {
  it("mounts and remounts without a log-only session request", async () => {
    await act(async () => {
      render(
        <StrictMode>
          <MainApp />
        </StrictMode>,
      );
    });

    expect(screen.getByText("Apps")).toBeTruthy();
    expect(getSession).not.toHaveBeenCalled();
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining(user.username),
    );
    expect(console.log).not.toHaveBeenCalledWith(
      expect.stringContaining(user.user_token),
    );
    expect(authentication.status.value).toBe("INIT");
  });

  it("keeps login rechecks and native authentication success connected", async () => {
    await act(async () => {
      render(<MainApp />);
    });

    fireEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(triggerRecheck).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: "Complete login" }));
    expect(authentication.status.value).toBe("LOGGED_IN");
    expect(authentication.userInfo.value).toBe(user);
    expect(getSession).not.toHaveBeenCalled();
  });
});
