import { axiosInstance } from "@/services/axios";

/**
 * Payload sent to AI Page Assistant
 */
export interface AiPageAssistantPayload {
  prompt: string;
  content?: string;
}

/**
 * API response
 */
export interface AiPageAssistantResponse {
  html: string;
}

/**
 * 🤖 Generate or enhance page HTML using AI
 * - prompt: user instruction
 * - content: existing TinyMCE HTML (optional)
 */
export const generatePageWithAI = async (
  payload: AiPageAssistantPayload
): Promise<AiPageAssistantResponse> => {
  const { data } = await axiosInstance.post<AiPageAssistantResponse>(
    "/ai/page-assistant",
    payload
  );

  return data;
};
