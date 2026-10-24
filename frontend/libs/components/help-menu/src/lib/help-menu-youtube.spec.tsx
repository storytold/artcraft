import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { HelpMenuButton } from "./help-menu";
import { useTutorialModalStore } from "./help-menu-store";

const mocks = vi.hoisted(() => ({
  Player: vi.fn(),
}));

vi.mock("@storyteller/icons", () => ({
  DiscordIcon: () => null,
  GithubIcon: () => null,
  YoutubeIcon: () => null,
}));
vi.mock("@storyteller/tauri-api", () => ({ OpenUrl: vi.fn() }));
vi.mock("@storyteller/markdown-content", () => ({
  getNewsPosts: () => [],
  markdownToHtml: (md: string) => md,
}));
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: ({ items, onSelect }: any) => (
    <div>
      {items.map((item: any) => (
        <button key={item.label} onClick={() => onSelect(item)}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

const IMAGE_EDITOR_VIDEO_ID = "ZASPqlqUBQc";
const STAGE_VIDEO_ID = "pM4CxN-isrY";

const resetYouTubeGlobals = () => {
  delete (window as any).YT;
  delete (window as any).onYouTubeIframeAPIReady;
  document.getElementById("youtube-iframe-api")?.remove();
};

beforeEach(() => {
  resetYouTubeGlobals();
  mocks.Player.mockReset();
  mocks.Player.mockImplementation(function (this: any) {
    this.destroy = vi.fn();
    this.getCurrentTime = vi.fn(() => 0);
  });
  useTutorialModalStore.setState({ view: "grid", selected: null, progress: {} });
});

afterEach(() => {
  cleanup();
  resetYouTubeGlobals();
});

it("builds only the newest tutorial's player when the YouTube API loads after Back and a new pick", async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  // First pick starts loading the (not yet available) YouTube API.
  await user.click(screen.getByRole("button", { name: /Image Editor Basics/ }));
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: /3D Stage & Posing/ }));

  // The API finally arrives while the second tutorial's container is mounted.
  (window as any).YT = { Player: mocks.Player };
  act(() => {
    (window as any).onYouTubeIframeAPIReady?.();
  });
  await waitFor(() => expect(mocks.Player).toHaveBeenCalled());
  // Outlast the 50ms poll the second request uses to notice the API.
  await new Promise((resolve) => setTimeout(resolve, 150));

  expect(mocks.Player).toHaveBeenCalledTimes(1);
  expect(mocks.Player.mock.calls[0][1].videoId).toBe(STAGE_VIDEO_ID);
});

it("still builds one player at the saved position and destroys it on Back", async () => {
  const user = userEvent.setup();
  (window as any).YT = { Player: mocks.Player };
  useTutorialModalStore.setState({ progress: { "2d-editor-basics": 12.7 } });
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  await user.click(screen.getByRole("button", { name: /Image Editor Basics/ }));

  await waitFor(() => expect(mocks.Player).toHaveBeenCalledTimes(1));
  const [, config] = mocks.Player.mock.calls[0];
  expect(config.videoId).toBe(IMAGE_EDITOR_VIDEO_ID);
  expect(config.playerVars.start).toBe(12);

  const player = mocks.Player.mock.instances[0] as any;
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(player.destroy).toHaveBeenCalledTimes(1);
});
