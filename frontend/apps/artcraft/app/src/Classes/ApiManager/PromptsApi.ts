import { ApiManager, ApiResponse } from "./ApiManager";
import { Prompts } from "~/pages/PageScene/models";

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
}
