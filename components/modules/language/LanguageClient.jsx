"use client";
// components/modules/language/LanguageClient.jsx
// Interactive search, tabs, collapsible sections, copy-to-clipboard,
// and Hindi speech synthesis for campus language help.

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Volume2,
  Copy,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";
import Card from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import EmptyState from "@/components/ui/EmptyState";

export default function LanguageClient({ phraseGroups, campusGlossary }) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("phrases"); // "phrases" | "glossary"
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [hasSpeechSupport, setHasSpeechSupport] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setHasSpeechSupport(true);
    }
  }, []);

  const toggleGroup = (groupId) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Filter phrases by English, Hindi, or Romanized text
  const filteredGroups = useMemo(() => {
    if (!normalizedQuery) return phraseGroups;

    return phraseGroups
      .map((group) => {
        const matchingPhrases = group.phrases.filter(
          (p) =>
            p.english.toLowerCase().includes(normalizedQuery) ||
            p.hindi.includes(normalizedQuery) ||
            p.romanized.toLowerCase().includes(normalizedQuery)
        );
        return {
          ...group,
          phrases: matchingPhrases,
        };
      })
      .filter((group) => group.phrases.length > 0);
  }, [phraseGroups, normalizedQuery]);

  // Filter glossary items
  const filteredGlossary = useMemo(() => {
    if (!normalizedQuery) return campusGlossary;

    return campusGlossary.filter(
      (item) =>
        item.term.toLowerCase().includes(normalizedQuery) ||
        item.meaning.toLowerCase().includes(normalizedQuery)
    );
  }, [campusGlossary, normalizedQuery]);

  // Total matching counts for tabs
  const totalMatchingPhrases = useMemo(
    () => filteredGroups.reduce((acc, g) => acc + g.phrases.length, 0),
    [filteredGroups]
  );
  const totalMatchingGlossary = filteredGlossary.length;

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ message: "Copied Hindi phrase to clipboard", type: "success" });
    } catch {
      toast({ message: "Could not copy text to clipboard", type: "error" });
    }
  };

  const handleSpeak = (text) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "hi-IN";
      window.speechSynthesis.speak(utterance);
    } catch {
      toast({ message: "Speech playback failed in this browser", type: "error" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="relative">
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search phrases in English, Hindi, Romanized, or campus terms..."
          leftIcon={<Search size={18} className="text-slate-400" aria-hidden="true" />}
          className="w-full text-sm py-3"
          aria-label="Search campus vocabulary"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 px-2 py-1"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Language navigation tabs"
        className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "phrases"}
          onClick={() => setActiveTab("phrases")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]",
            activeTab === "phrases"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <MessageSquare size={16} aria-hidden="true" />
          Everyday Phrases
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            {totalMatchingPhrases}
          </span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "glossary"}
          onClick={() => setActiveTab("glossary")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 min-h-[44px]",
            activeTab === "glossary"
              ? "bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 shadow-sm"
              : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          )}
        >
          <BookOpen size={16} aria-hidden="true" />
          Campus Glossary
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
            {totalMatchingGlossary}
          </span>
        </button>
      </div>

      {/* Tab Panel: Phrases */}
      {activeTab === "phrases" && (
        <div className="space-y-6">
          {filteredGroups.length === 0 ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No matching phrases found"
              description="Try adjusting your search keywords or browsing the campus glossary tab."
            />
          ) : (
            filteredGroups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.id]);

              return (
                <div
                  key={group.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 overflow-hidden shadow-card"
                >
                  {/* Group Collapsible Header */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="w-full flex items-center justify-between p-4 sm:p-5 text-left bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-expanded={!isCollapsed}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white">
                          {group.title}
                        </h2>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                          ({group.phrases.length})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {group.description}
                      </p>
                    </div>

                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 shrink-0">
                      {isCollapsed ? (
                        <ChevronDown size={18} aria-hidden="true" />
                      ) : (
                        <ChevronUp size={18} aria-hidden="true" />
                      )}
                    </div>
                  </button>

                  {/* Phrases List */}
                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.phrases.map((phrase) => (
                        <div
                          key={phrase.id}
                          className="flex flex-col justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-150"
                        >
                          <div className="mb-3">
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                              {phrase.english}
                            </p>
                            <p className="text-lg font-bold text-slate-900 dark:text-white tracking-wide mb-1 leading-snug">
                              {phrase.hindi}
                            </p>
                            <p className="text-xs font-medium text-primary-600 dark:text-primary-400 italic">
                              &ldquo;{phrase.romanized}&rdquo;
                            </p>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {hasSpeechSupport && (
                              <button
                                type="button"
                                onClick={() => handleSpeak(phrase.hindi)}
                                aria-label={`Listen to ${phrase.english} in Hindi`}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
                              >
                                <Volume2 size={14} aria-hidden="true" />
                                Listen
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleCopy(phrase.hindi)}
                              aria-label={`Copy Hindi script for ${phrase.english}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors min-h-[36px]"
                            >
                              <Copy size={14} aria-hidden="true" />
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab Panel: Campus Glossary */}
      {activeTab === "glossary" && (
        <div className="space-y-4">
          {filteredGlossary.length === 0 ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No glossary terms found"
              description="No campus terms match your query. Try searching for terms like 'FRRO', 'Warden', or 'Backlog'."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossary.map((item, idx) => (
                <Card key={idx} className="p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={15} className="text-primary-500 shrink-0" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {item.term}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.meaning}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
