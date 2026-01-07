import { Intent } from "./intent";

// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 消息状态
export type MessageStatus = "sending" | "sent" | "error";

// 基础消息
export interface BaseMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: MessageStatus;
}

// 用户消息
export interface UserMessage extends BaseMessage {
  role: "user";
}

// AI 消息
export interface AssistantMessage extends BaseMessage {
  role: "assistant";
  intents?: Intent[];
  isStreaming?: boolean;
}

// 系统消息
export interface SystemMessage extends BaseMessage {
  role: "system";
}

// 消息联合类型
export type ChatMessage = UserMessage | AssistantMessage | SystemMessage;

// 聊天状态
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  pendingIntents: Intent[];
}

// 聊天请求
export interface ChatRequest {
  message: string;
  walletAddress?: string;
  chainId?: number;
  history?: ChatMessage[];
}

// 聊天响应
export interface ChatResponse {
  message: string;
  intents: Intent[];
  needsConfirmation: boolean;
}

