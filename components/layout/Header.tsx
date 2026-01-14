"use client";

import { useState } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Sparkles, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { TransactionHistory } from "@/components/history/TransactionHistory";

export function Header() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  return (
    <>
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-4xl flex h-16 items-center justify-between px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xl font-bold gradient-text">Intent Bot</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsHistoryOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">历史记录</span>
            </Button>
            <ConnectButton
              chainStatus="icon"
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>
      </header>

      {/* History Dialog */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] p-0">
          <TransactionHistory onClose={() => setIsHistoryOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}

