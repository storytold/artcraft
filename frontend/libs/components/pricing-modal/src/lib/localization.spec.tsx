import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { setLocale } from "@storyteller/i18n";
import { GenerationProvider } from "@storyteller/common";
import { PricingContent } from "./pricing-modal";
import { CreditsModal } from "./credits-modal";
import { ProviderSetupModal } from "../../../provider-setup-modal/src/lib/provider-setup-modal";
import { ArtcraftBillingBlock } from "../../../provider-billing-modal/src/lib/artcraft/ArtcraftBillingBlock";

const state = vi.hoisted(() => ({
  invoke: vi.fn().mockResolvedValue(undefined),
  paid: false,
  showProvider: undefined as
    | undefined
    | ((event: { provider: GenerationProvider }) => Promise<void>),
}));
vi.mock("@tauri-apps/api/core", () => ({ invoke: state.invoke }));
vi.mock("@storyteller/tauri-api", () => ({ OpenUrl: vi.fn() }));
vi.mock("@storyteller/tauri-events", () => ({
  useShowProviderLoginModalEvent: (callback: typeof state.showProvider) => {
    state.showProvider = callback;
  },
}));
vi.mock("@storyteller/subscription", async (original) => ({
  ...(await original<typeof import("@storyteller/subscription")>()),
  useSubscriptionState: () => ({
    hasPaidPlan: () => state.paid,
    subscriptionInfo: { productSlug: "artcraft_basic" },
  }),
}));

afterEach(async () => {
  cleanup();
  await setLocale("en");
  state.paid = false;
  vi.clearAllMocks();
});

it("retains monthly cadence across language changes and submits the original plan ID", async () => {
  render(<PricingContent />);
  fireEvent.click(screen.getByText("Monthly", { exact: true }));
  await act(() => setLocale("zh-CN"));
  expect(screen.getByText("选择套餐", { exact: true })).toBeTruthy();
  expect(screen.getByText("1,000 积分/月", { exact: true })).toBeTruthy();
  expect(screen.getAllByText("按月付费 · 随时取消")).toHaveLength(3);
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "订阅 Basic", exact: true }),
    ),
  );
  expect(state.invoke).toHaveBeenCalledWith(
    "storyteller_open_subscription_purchase_command",
    { request: { plan: "artcraft_basic", cadence: "monthly" } },
  );
  await act(() => setLocale("en"));
  expect(
    screen.getByRole("button", { name: "Get Basic", exact: true }),
  ).toBeTruthy();
});

it("keeps the current plan disabled and switches paid plans using unchanged identifiers", async () => {
  state.paid = true;
  await setLocale("zh-CN");
  render(<PricingContent />);
  expect(
    (
      screen.getByRole("button", {
        name: "当前套餐",
        exact: true,
      }) as HTMLButtonElement
    ).disabled,
  ).toBe(true);
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "切换至 Pro", exact: true }),
    ),
  );
  expect(state.invoke).toHaveBeenCalledWith(
    "storyteller_open_customer_portal_switch_plan_command",
    { request: { plan: "artcraft_pro", cadence: "yearly" } },
  );
  await act(async () =>
    fireEvent.click(
      screen.getByRole("button", { name: "更新付款方式", exact: true }),
    ),
  );
  expect(state.invoke).toHaveBeenCalledWith(
    "storyteller_open_customer_portal_update_payment_method_command",
  );
});

it("preserves credit pack IDs and dollar prices in the translated dialog", async () => {
  await setLocale("zh-CN");
  render(<CreditsModal isOpen />);
  expect(screen.getByRole("heading", { name: /购买\s*积分/ })).toBeTruthy();
  const pack = screen.getByRole("button", { name: /1,000.*积分.*\$10.*购买/ });
  await act(async () => fireEvent.click(pack));
  expect(state.invoke).toHaveBeenCalledWith(
    "storyteller_open_credits_purchase_command",
    { request: { credits_pack: "artcraft_1000" } },
  );
  await act(() => setLocale("en"));
  expect(screen.getByRole("heading", { name: "Buy credits" })).toBeTruthy();
});

it.each([
  [GenerationProvider.Grok, "Grok", "grok_open_login_command"],
  [
    GenerationProvider.Midjourney,
    "Midjourney",
    "midjourney_open_login_command",
  ],
])(
  "preserves %s login routing through a live locale switch",
  async (provider, name, command) => {
    render(<ProviderSetupModal />);
    await act(async () => {
      await state.showProvider?.({ provider });
    });
    expect(
      screen.getByRole("heading", { name: `Set up ${name}` }),
    ).toBeTruthy();
    await act(() => setLocale("zh-CN"));
    expect(screen.getByRole("heading", { name: `设置 ${name}` })).toBeTruthy();
    await act(async () =>
      fireEvent.click(screen.getByRole("button", { name: `设置 ${name}` })),
    );
    expect(state.invoke).toHaveBeenCalledWith(command);
  },
);

it("updates the billing explanation when switching languages", async () => {
  render(<ArtcraftBillingBlock isVideoPage />);
  await act(() => setLocale("zh-CN"));
  expect(
    screen.getByRole("heading", { name: "视频生成需要大量算力" }),
  ).toBeTruthy();
  expect(screen.getByText(/^生成高质量视频需要大量算力/)).toBeTruthy();
});
