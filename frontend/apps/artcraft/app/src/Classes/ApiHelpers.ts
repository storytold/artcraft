import { GetCdnOrigin } from "~/api/GetCdnOrigin";
import { StorytellerApiHostStore } from "@storyteller/api";

export async function get_media_url(mediaId: string) {
  //This is for prod when we have the proper info on the url.
  const apiSchemeAndHost = StorytellerApiHostStore.getInstance().getApiSchemeAndHost();
  const url = `${apiSchemeAndHost}/v1/media_files/file/${mediaId}`;

  const response = await fetch(url);
  const json = await JSON.parse(await response.text());
  const bucketPath = json["media_file"]["public_bucket_path"];

  const media_api_base_url = GetCdnOrigin();

  const media_url = `${media_api_base_url}${bucketPath}`;
  return media_url;
}
