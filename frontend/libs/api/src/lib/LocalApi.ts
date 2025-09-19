
import { download } from "@tauri-apps/plugin-upload";
import { downloadDir } from "@tauri-apps/api/path";

export const downloadFileFromUrl = async (url: string) => {
    console.log("GOT THE URL", url);
    try {
      // Extract filename from URL
      const urlObj = new URL(url);
      let filename = urlObj.pathname.split("/").pop();
      if (!filename || filename === "") {
        filename = "downloaded_file";
      }

      // Get downloads directory path
      const downloadsPath = await downloadDir();
      const filePath = `${downloadsPath}/${filename}`;

      // Download and save the file
      await download(url, filePath);

      console.log(
        `File downloaded and saved as ${filename} in downloads folder`,
      );
    } catch (error) {
      console.error("Error downloading file:", error);
      throw error;
    }
  };