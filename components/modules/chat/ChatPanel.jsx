// components/modules/chat/ChatPanel.jsx
// Stateful client orchestrator for the Campus Compass AI Assistant.
// Holds all conversation state exclusively in memory (cleared on refresh).

"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, RefreshCw, AlertCircle, X, Sparkles, Bot } from "lucide-react";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import StarterChips from "./StarterChips";

export default function ChatPanel({ firstName = "Student", starterQuestions = [] }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [waitSeconds, setWaitSeconds] = useState(0);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // Reference to abort controller for canceling in-flight request
  const abortControllerRef = useRef(null);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Countdown timer for rate limiting
  useEffect(() => {
    if (waitSeconds <= 0) return;
    const interval = setInterval(() => {
      setWaitSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [waitSeconds]);

  const sendMessage = useCallback(
    async (textToSend, customHistory = null) => {
      const trimmed = (textToSend || "").trim();
      if (!trimmed || isLoading || waitSeconds > 0) return;

      setError(null);

      // Construct history payload
      const baseHistory = customHistory !== null ? customHistory : messages;
      const newMessages = [...baseHistory, { role: "user", text: trimmed }];
      setMessages(newMessages);
      setInput("");
      setIsLoading(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const payloadMessages = newMessages.slice(-20).map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ messages: payloadMessages }),
          signal: controller.signal,
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429 && data.retryAfterSeconds) {
            setWaitSeconds(data.retryAfterSeconds);
          }
          setError({
            message: data.error || "The assistant could not respond. Please try again.",
            code: data.code || "error",
          });
          return;
        }

        // Add assistant message
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.answer,
            sources: data.sources || [],
          },
        ]);
      } catch (err) {
        if (err.name === "AbortError") {
          // Request was stopped by user
          return;
        }
        setError({
          message: "Network error. Please check your connection and try again.",
          code: "network_error",
        });
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [messages, isLoading, waitSeconds]
  );

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (messages.length === 0 || isLoading) return;
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const actualIdx = messages.length - 1 - lastUserIdx;
    const lastUserMsg = messages[actualIdx];
    const historyBeforeLastUser = messages.slice(0, actualIdx);

    sendMessage(lastUserMsg.text, historyBeforeLastUser);
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      const confirmClear = window.confirm(
        "Start a new conversation? Current chat messages will be cleared."
      );
      if (!confirmClear) return;
    }
    handleStop();
    setMessages([]);
    setError(null);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-9.5rem)] min-h-[580px] max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800/80 text-primary-700 dark:text-primary-300 flex items-center justify-center shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-slate-900 dark:text-slate-100 leading-tight">
              Campus Compass Assistant
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified campus guides, arrival steps, and student checklist
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewChat}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors shadow-xs active:scale-95"
          title="Clear current messages and start fresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New chat</span>
        </button>
      </div>

      {/* Dismissible Safety and Privacy Banner */}
      {!isBannerDismissed && (
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/50 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Answers are generated by AI using verified campus guides and can make mistakes.
              Confirm official procedures with your university&apos;s international office. Please do
              not share passwords, bank OTPs, ID numbers, or financial credentials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsBannerDismissed(true)}
            aria-label="Dismiss notice"
            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-100 p-0.5 rounded transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Conversation Area */}
      {messages.length === 0 ? (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-300 flex items-center justify-center mb-3.5 shadow-sm">
            <MessageSquare className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Welcome, {firstName}!
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md">
            I can help you navigate local SIM cards, bank accounts, arrival documents,
            and your pending checklist tasks.
          </p>

          <StarterChips
            questions={starterQuestions}
            onSelectQuestion={(q) => sendMessage(q)}
          />
        </div>
      ) : (
        <MessageList
          messages={messages}
          isThinking={isLoading}
          error={error}
          onRetry={error ? handleRetry : null}
        />
      )}

      {/* Bottom Chat Input */}
      <ChatInput
        input={input}
        setInput={setInput}
        onSend={() => sendMessage(input)}
        onStop={handleStop}
        isLoading={isLoading}
        waitSeconds={waitSeconds}
      />
    </div>
  );
}
