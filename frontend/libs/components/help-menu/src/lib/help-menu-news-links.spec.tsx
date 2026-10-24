// help-menu-news-links.spec: checks what happens when a link inside a News & Updates article is clicked.
// The article text is turned into HTML and put on the page as-is, so its links are ordinary <a href> tags. Inside the
// desktop app a plain click on such a tag is not handled by anything (the system-browser helper only acts on
// target="_blank" links), so the app's own window would navigate away to the web page, or to a page that does not
// exist (the shipped article links to "/download" and "/press-kit#top"). The Help menu's own Discord/GitHub items
// already use OpenUrl to open the system browser; article links must do the same.
// The real markdown renderer runs (so the anchors are exactly what the shipped article produces); the modal, popover
// and button are replaced with plain stand-ins; OpenUrl is a spy.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Shared handles the mock factories below can see (vi.mock is hoisted above normal variables).
const m = vi.hoisted(() => ({
  openUrl: vi.fn(),
}));

vi.mock("@storyteller/icons", () => ({
  DiscordIcon: () => null,
  GithubIcon: () => null,
  YoutubeIcon: () => null,
}));
vi.mock("@storyteller/tauri-api", () => ({ OpenUrl: m.openUrl }));
// Keep the real markdown renderer, but serve one small article instead of the shipped posts.
vi.mock("@storyteller/markdown-content", async () => {
  const actual = await vi.importActual<typeof import("@storyteller/markdown-content")>(
    "@storyteller/markdown-content",
  );
  return {
    ...actual,
    getNewsPosts: () => [
      {
        slug: "links-post",
        title: "Links post",
        date: "2026-01-01",
        description: "A post with links",
        // The same four link shapes the shipped "Machinima 2.0" article contains, plus a same-page jump.
        body: [
          "Star us on [Github](https://github.com/storytold/artcraft) today.",
          "",
          "Get it for [Mac or Windows](/download), [join our Discord](https://discord.gg/artcraft),",
          "see the [press kit](/press-kit#top) or [jump ahead](#credits).",
        ].join("\n"),
      },
    ],
  };
});
vi.mock("@storyteller/ui-modal", () => ({
  Modal: ({ isOpen, children }: { isOpen: boolean; children: unknown }) =>
    isOpen ? <div>{children as never}</div> : null,
}));
vi.mock("@storyteller/ui-button", () => ({
  Button: ({ children, onClick }: Record<string, never>) => <button onClick={onClick}>{children}</button>,
}));
vi.mock("@storyteller/ui-popover", () => ({
  PopoverMenu: ({ items, onSelect }: { items: { label: string }[]; onSelect: (item: unknown) => void }) => (
    <div>
      {items.map((item) => (
        <button key={item.label} onClick={() => onSelect(item)}>
          {item.label}
        </button>
      ))}
    </div>
  ),
}));

import { HelpMenuButton } from "./help-menu";
import { useTutorialModalStore } from "./help-menu-store";

// Open Help -> News & Updates -> the one article, and return the user-event helper.
const openArticle = async () => {
  const user = userEvent.setup();
  render(<HelpMenuButton />);
  await user.click(screen.getByRole("button", { name: "News & Updates" }));
  await user.click(screen.getByText("Links post"));
  return user;
};

describe("News article links", () => {
  beforeEach(() => {
    m.openUrl.mockReset();
    // The news list is also fetched from the website; pretend that fetch failed so the bundled post is used
    // and no real network call is made.
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    useTutorialModalStore.setState({ view: "grid", selected: null, progress: {} });
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("opens an external article link in the system browser instead of navigating the app window", async () => {
    await openArticle();
    // fireEvent.click returns false when the click's default action (following the link) was cancelled.
    const followed = fireEvent.click(screen.getByRole("link", { name: "Github" }));
    expect(m.openUrl).toHaveBeenCalledWith("https://github.com/storytold/artcraft");
    expect(followed).toBe(false);
  });

  it("opens the Discord invite link the same way", async () => {
    await openArticle();
    const followed = fireEvent.click(screen.getByRole("link", { name: "join our Discord" }));
    expect(m.openUrl).toHaveBeenCalledWith("https://discord.gg/artcraft");
    expect(followed).toBe(false);
  });

  it("sends site-relative links (/download) to the website instead of a page that does not exist in the app", async () => {
    await openArticle();
    const followed = fireEvent.click(screen.getByRole("link", { name: "Mac or Windows" }));
    expect(m.openUrl).toHaveBeenCalledWith("https://getartcraft.com/download");
    expect(followed).toBe(false);
  });

  it("keeps the #fragment on a site-relative link", async () => {
    await openArticle();
    fireEvent.click(screen.getByRole("link", { name: "press kit" }));
    expect(m.openUrl).toHaveBeenCalledWith("https://getartcraft.com/press-kit#top");
  });

  it("leaves a same-page #jump link alone (nothing to open)", async () => {
    await openArticle();
    const followed = fireEvent.click(screen.getByRole("link", { name: "jump ahead" }));
    expect(m.openUrl).not.toHaveBeenCalled();
    expect(followed).toBe(true);
  });

  it("does nothing when the click is on article text that is not a link", async () => {
    await openArticle();
    const followed = fireEvent.click(screen.getByText(/Star us on/));
    expect(m.openUrl).not.toHaveBeenCalled();
    expect(followed).toBe(true);
  });
});
