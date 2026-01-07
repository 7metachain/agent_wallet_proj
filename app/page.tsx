import { ChatContainer } from "@/components/chat/ChatContainer";
import { Header } from "@/components/layout/Header";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Header />
      <div className="flex-1 container mx-auto max-w-4xl px-4 py-6">
        <ChatContainer />
      </div>
    </main>
  );
}

