"use client";
import React from "react";
import { Sun, Moon } from "lucide-react";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import {
  useChatRuntime,
  AssistantChatTransport,
} from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadListSidebar } from "@/components/assistant-ui/threadlist-sidebar";
import { Separator } from "@/components/ui/separator";

export const Assistant = () => {
  const runtime = useChatRuntime({
    transport: new AssistantChatTransport({
      api: "/api/chat",
    }),
  });
    // Dark mode state
    const [darkMode, setDarkMode] = React.useState(true);

    React.useEffect(() => {
      if (darkMode) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }, [darkMode]);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SidebarProvider>
        <div className="flex h-dvh w-full pr-0.5">
          <ThreadListSidebar />
          <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 h-4" />
                 <button
                onClick={() => setDarkMode((d) => !d)}
                className="ml-auto flex items-center justify-center rounded-full border px-2 py-1 bg-muted text-foreground hover:bg-accent transition-colors"
                aria-label="Toggle dark mode"
              >
                <span className="relative block size-6">
                  <Sun
                    className={`absolute inset-0 transition-all duration-300 ${darkMode ? 'opacity-0 scale-75 rotate-90' : 'opacity-100 scale-100 rotate-0'} text-yellow-500`}
                    size={24}
                  />
                  <Moon
                    className={`absolute inset-0 transition-all duration-300 ${darkMode ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-75 -rotate-90'} text-blue-400`}
                    size={24}
                  />
                </span>
              </button>
            </header>
            <div className="flex-1 overflow-hidden">
              <Thread />
            </div>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </AssistantRuntimeProvider>
  );
};
