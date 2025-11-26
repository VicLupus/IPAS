import api from './client';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  success: boolean;
  message: string;
  conversationHistory: ChatMessage[];
}

export const chatApi = {
  sendMessage: async (
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat/message', {
      message,
      conversationHistory,
    });
    return response.data;
  },
};

