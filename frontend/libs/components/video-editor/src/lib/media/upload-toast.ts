import type { ToastAdapter } from "../adapters/toast";

// Upload toast — host-routed. The OpenCut original called sonner's
// `toast.promise` directly which gives a single dynamic toast that
// transitions loading → success/error. The ToastAdapter doesn't have
// `.promise`, so we approximate with: loading toast → swap to
// success/error on settle. Hosts with richer toast surfaces can shadow
// this helper if they want the original behavior.

export interface MediaUploadToastResult {
  uploadedCount: number;
  assetNames?: string[];
}

function getAssetLabel({ count }: { count: number }): string {
  return count === 1 ? "media asset" : "media assets";
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export async function showMediaUploadToast<T extends MediaUploadToastResult>({
  filesCount,
  toast,
  promise,
}: {
  filesCount: number;
  toast: ToastAdapter;
  promise: Promise<T> | (() => Promise<T>);
}): Promise<T> {
  const run = typeof promise === "function" ? promise : () => promise;
  toast.info(`Uploading ${getAssetLabel({ count: filesCount })}...`);
  await waitForNextPaint();

  try {
    const result = await run();
    const { uploadedCount, assetNames } = result;
    if (uploadedCount === 1) {
      const assetName = assetNames?.[0];
      toast.success(
        assetName
          ? `${assetName} has been uploaded`
          : "1 media asset has been uploaded",
      );
    } else if (uploadedCount > 1) {
      toast.success(`${uploadedCount} media assets have been uploaded`);
    } else {
      toast.warning("No media assets were uploaded");
    }
    return result;
  } catch (error) {
    toast.error(`Failed to upload ${getAssetLabel({ count: filesCount })}`, {
      description: error instanceof Error ? error.message : undefined,
    });
    throw error;
  }
}
