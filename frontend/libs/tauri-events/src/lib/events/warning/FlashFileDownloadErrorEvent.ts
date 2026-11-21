import { listen, UnlistenFn } from '@tauri-apps/api/event';
import { BasicEventWrapper } from '../../common/BasicEventWrapper';
import { useEffect } from 'react';

const EVENT_NAME : string = 'flash_file_download_error_event';

export enum FlashFileDownloadErrorType {
  FileAlreadyDownloaded = "file_already_downloaded",
  FilesystemError = "filesystem_error",
  NetworkError = "network_error",
  UnknownError = "unknown_error",
}

export interface FlashFileDownloadErrorEvent {
  error_type: FlashFileDownloadErrorType,
  message?: string,
  filename?: string,
}

export const useFlashFileDownloadErrorEvent = (asyncCallback: (event: FlashFileDownloadErrorEvent) => Promise<void>) => {
  useEffect(() => {
    let isUnmounted = false;
    let unlisten: Promise<UnlistenFn>;

    const setup = async () => {
      unlisten = listen<BasicEventWrapper<FlashFileDownloadErrorEvent>>(EVENT_NAME, async (wrappedEvent) => {
        await asyncCallback(wrappedEvent.payload.data);
      });

      if (isUnmounted) {
        unlisten.then(f => f()); // Unsubscribe if unmounted early.
      }
    };

    setup();
    
    return () => {
      isUnmounted = true;
      unlisten.then(f => f());
    };

  }, []);
}
