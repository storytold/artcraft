import { ApiManager, ApiResponse } from "./ApiManager";
import { Prompts } from "~/pages/PageEnigma/models";

export class PromptsApi extends ApiManager {
  public GetPromptsByToken({
    token,
  }: {
    token: string;
  }): Promise<ApiResponse<Prompts>> {
    const endpoint = `${this.getApiSchemeAndHost()}/v1/prompts/${token}`;

    return this.get<{
      success: boolean;
      prompt: Prompts;
      error_reason?: string;
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.prompt,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }

  public BatchGetPrompts({
    tokens,
  }: {
    tokens: string[];
  }): Promise<ApiResponse<Prompts[]>> {
    if (tokens.length === 0) {
      return Promise.resolve({ success: true, data: [] });
    }
    const query = tokens
      .map((t) => `tokens=${encodeURIComponent(t)}`)
      .join("&");
    const endpoint = `${this.getApiSchemeAndHost()}/v1/prompt/batch?${query}`;

    return this.get<{
      success: boolean;
      prompts: Prompts[];
    }>({ endpoint })
      .then((response) => ({
        success: response.success,
        data: response.prompts,
      }))
      .catch((err) => {
        return { success: false, errorMessage: err.message };
      });
  }
}
