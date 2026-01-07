"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRightLeft,
  PiggyBank,
  SendHorizontal,
  Wallet,
  Sparkles,
} from "lucide-react";

interface WelcomeScreenProps {
  isConnected: boolean;
  onExampleClick: (message: string) => void;
}

const examples = [
  {
    icon: ArrowRightLeft,
    title: "Swap Tokens",
    description: "Exchange one token for another",
    prompt: "Swap 100 USDC to ETH",
  },
  {
    icon: PiggyBank,
    title: "Earn Yield",
    description: "Deposit to Aave and earn interest",
    prompt: "Supply 0.1 ETH to Aave",
  },
  {
    icon: SendHorizontal,
    title: "Transfer",
    description: "Send tokens to any address",
    prompt: "Send 50 USDC to vitalik.eth",
  },
  {
    icon: Wallet,
    title: "Check Balance",
    description: "View your token holdings",
    prompt: "What's my balance?",
  },
];

export function WelcomeScreen({
  isConnected,
  onExampleClick,
}: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-8">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-3xl font-bold gradient-text mb-2">
          Welcome to Intent Bot
        </h1>
        <p className="text-muted-foreground max-w-md">
          Trade, swap, and earn yield using natural language. <br />
          Just tell me what you want to do!
        </p>
      </div>

      {/* Example Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
        {examples.map((example, index) => {
          const Icon = example.icon;
          return (
            <Card
              key={index}
              className={`cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50 ${
                !isConnected ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => isConnected && onExampleClick(example.prompt)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">{example.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {example.description}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {!isConnected && (
        <p className="text-sm text-muted-foreground mt-6">
          👆 Connect your wallet above to get started
        </p>
      )}
    </div>
  );
}

