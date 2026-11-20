import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ButtonHTMLAttributes } from "react";
import { SendToStageButton } from "./SendToStageButton";

const notify = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("react-hot-toast", () => ({ default: notify }));
vi.mock("@storyteller/ui-button", () => ({ Button: ({ children, disabled, onClick }: ButtonHTMLAttributes<HTMLButtonElement>) => <button disabled={disabled} onClick={onClick}>{children}</button> }));
beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("SendToStageButton", () => {
  it("allows one transfer and closes only after confirmed success", async () => {
    let finish!: () => void;
    const onSend = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const onSent = vi.fn();
    render(<SendToStageButton onSend={onSend} onSent={onSent} />);
    fireEvent.click(screen.getByRole("button"));
    fireEvent.click(screen.getByRole("button"));
    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSent).not.toHaveBeenCalled();
    expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
    finish();
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
    expect(notify.success).toHaveBeenCalledTimes(1);
  });

  it("keeps the viewer open and permits retry after a failed transfer", async () => {
    const onSend = vi.fn().mockRejectedValueOnce(new Error("Model download failed")).mockResolvedValueOnce(undefined);
    const onSent = vi.fn();
    render(<SendToStageButton onSend={onSend} onSent={onSent} />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(notify.error).toHaveBeenCalledWith("Model download failed"));
    expect(onSent).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(onSent).toHaveBeenCalledTimes(1));
  });
});
