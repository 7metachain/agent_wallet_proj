"use client";

import { useState, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { ChatMessages } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { WelcomeScreen } from "./WelcomeScreen";
import { ChatMessage } from "@/types/chat";
import { WELCOME_MESSAGE } from "@/lib/ai/prompts";
import { v4 as uuidv4 } from "uuid";

export function ChatContainer() {
  const { address, isConnected } = useAccount();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 发送消息
  const handleSendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    // 添加用户消息
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: "user",
      content: content.trim(),
      timestamp: Date.now(),
      status: "sent",
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 调用 AI API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: content,
          walletAddress: address,
          chainId: 84532, // Base Sepolia
          history: messages.slice(-10), // 只发送最近10条消息
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      // 添加 AI 回复
      const assistantMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: data.message,
        timestamp: Date.now(),
        intents: data.intents,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      // 添加错误消息
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 如果没有消息，显示欢迎界面
  if (messages.length === 0) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <WelcomeScreen
          isConnected={isConnected}
          onExampleClick={handleSendMessage}
        />
        <ChatInput
          onSend={handleSendMessage}
          isLoading={isLoading}
          disabled={!isConnected}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <ChatMessages messages={messages} isLoading={isLoading} />
      <div ref={messagesEndRef} />
      <ChatInput
        onSend={handleSendMessage}
        isLoading={isLoading}
        disabled={!isConnected}
      />
    </div>
  );
}

