// Testing-library helpers: render the component, find things by role/name, wait for async results, and wrap changes in act().
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
// userEvent drives clicks the way a person would (pointer down/up, focus, then click).
import userEvent from "@testing-library/user-event";
// Vitest test API: hooks, assertions, and spy/mocking helpers.
import { afterEach, beforeEach, expect, it, vi } from "vitest";
// The component under test (the Help button with its Tutorials window).
import { HelpMenuButton } from "./help-menu";
// The zustand store behind the Help window, so each test can start from a clean state.
import { useTutorialModalStore } from "./help-menu-store";

// vi.hoisted makes the fake YouTube `Player` class available to the vi.mock factories below.
const mocks = vi.hoisted(() => ({
  Player: vi.fn(),
}));

// The brand icons are not under test; draw nothing for them.
vi.mock("@storyteller/icons", () => ({
  DiscordIcon: () => null,
  GithubIcon: () => null,
  YoutubeIcon: () => null,
}));
// OpenUrl would call the Tauri shell, which does not exist in jsdom; a spy is enough.
vi.mock("@storyteller/tauri-api", () => ({ OpenUrl: vi.fn() }));
// The News screen is not under test; give it no articles.
vi.mock("@storyteller/markdown-content", () => ({
  getNewsPosts: () => [],
  markdownToHtml: (md: string) => md,
}));
// A stand-in window: shows its children only while `isOpen` is true (the real one adds animation and a backdrop).
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: any) => (isOpen ? <div>{children}</div> : null),
}));
// A plain button in place of the shared Button component.
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));
// A flat list of buttons in place of the pop-up menu, so a test can click "Tutorials" directly.
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

// The address the help menu asks the browser to load YouTube's player script from.
const IFRAME_API_SRC = "https://www.youtube.com/iframe_api";
// The video id inside the "3D Stage & Posing" tutorial's address (see tutorials.ts).
const STAGE_VIDEO_ID = "pM4CxN-isrY";

// Put the page back to "YouTube's script was never requested": no player class, no ready callback, no script tag.
const resetYouTubeGlobals = () => {
  delete (window as any).YT;
  delete (window as any).onYouTubeIframeAPIReady;
  document.getElementById("youtube-iframe-api")?.remove();
};

// Before each test: clean YouTube globals, a fake Player class that records its calls, and the Help window store reset.
beforeEach(() => {
  resetYouTubeGlobals();
  mocks.Player.mockReset();
  mocks.Player.mockImplementation(function (this: any) {
    this.destroy = vi.fn();
    this.getCurrentTime = vi.fn(() => 0);
  });
  useTutorialModalStore.setState({ view: "grid", selected: null, progress: {} });
});

// After each test: unmount, restore any spies, and clear the YouTube globals again so tests cannot leak into each other.
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  resetYouTubeGlobals();
});

// Every <script> element currently in the page that points at YouTube's player script.
const youtubeScripts = () =>
  Array.from(document.querySelectorAll("script")).filter(
    (s) => s.getAttribute("src") === IFRAME_API_SRC,
  );

// COUNTED: a failed download of YouTube's script must not poison every later attempt.
it("asks for YouTube's script again after the first download failed", async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  // First tutorial pick: the script is requested (a tag appears in the page).
  await user.click(screen.getByRole("button", { name: /Image Editor Basics/ }));
  const failedTag = youtubeScripts()[0];
  expect(failedTag).toBeTruthy();

  // The download fails (offline, or the request is blocked). A browser fires `error` on the tag and leaves it in the page.
  act(() => {
    failedTag.dispatchEvent(new Event("error"));
  });

  // Back to the grid, then pick another tutorial.
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: /3D Stage & Posing/ }));

  // The new pick must ask for the script again: a fresh tag, not the failed one.
  await waitFor(() => {
    const current = youtubeScripts();
    expect(current.length).toBe(1);
    expect(current[0]).not.toBe(failedTag);
  });

  // The retry succeeds: YouTube's script defines the player class and calls its ready callback.
  (window as any).YT = { Player: mocks.Player };
  act(() => {
    (window as any).onYouTubeIframeAPIReady?.();
  });
  // The second tutorial's player is built (one player, right video).
  await waitFor(() => expect(mocks.Player).toHaveBeenCalledTimes(1));
  expect(mocks.Player.mock.calls[0][1].videoId).toBe(STAGE_VIDEO_ID);
});

// COUNTED: a pick that was waiting on a script that then failed must stop waiting instead of polling forever.
it("stops polling for the YouTube player once the script it was waiting for has failed", async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  // First pick adds the script tag; Back and a second pick wait on that same tag by polling every 50 ms.
  await user.click(screen.getByRole("button", { name: /Image Editor Basics/ }));
  const tag = youtubeScripts()[0];
  await user.click(screen.getByRole("button", { name: "Back" }));
  await user.click(screen.getByRole("button", { name: /3D Stage & Posing/ }));

  // The download fails while the second pick is waiting.
  act(() => {
    tag.dispatchEvent(new Event("error"));
  });
  // Let the poll that was already scheduled run once, then start counting from a quiet point.
  await new Promise((resolve) => setTimeout(resolve, 120));
  const timers = vi.spyOn(window, "setTimeout");
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Count only the 50 ms poll ticks (the test's own wait uses a different delay).
  const pollTicks = timers.mock.calls.filter(([, delay]) => delay === 50).length;
  // A loop that never gives up would tick about six times in 300 ms.
  expect(pollTicks).toBe(0);
});

// CONTROL: when the script loads fine, the existing behaviour is unchanged (one player for the picked tutorial).
it("still builds the player when the script loads normally", async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  await user.click(screen.getByRole("button", { name: /3D Stage & Posing/ }));
  // The tag is in the page and has not failed.
  expect(youtubeScripts().length).toBe(1);

  // The script loads and calls YouTube's ready callback.
  (window as any).YT = { Player: mocks.Player };
  act(() => {
    (window as any).onYouTubeIframeAPIReady?.();
  });
  await waitFor(() => expect(mocks.Player).toHaveBeenCalledTimes(1));
  expect(mocks.Player.mock.calls[0][1].videoId).toBe(STAGE_VIDEO_ID);
});

// CONTROL: a failed download builds no player. (A rejection nobody handled would also make vitest fail the whole run with
// "Unhandled Rejection", so this test doubles as the guard that the loader's failure is caught.)
it("builds no player and raises no unhandled error when the script fails", async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "Tutorials" }));
  await user.click(screen.getByRole("button", { name: /Image Editor Basics/ }));
  const tag = youtubeScripts()[0];
  act(() => {
    tag.dispatchEvent(new Event("error"));
  });
  // Give a rejected promise time to reach the event loop's unhandled-rejection check.
  await new Promise((resolve) => setTimeout(resolve, 100));
  // No player was built.
  expect(mocks.Player).not.toHaveBeenCalled();
});
