// app/language/page.jsx
// Language Help & Campus Glossary for international students.

import { requireUser } from "@/lib/session";
import AppShell from "@/components/layout/AppShell";
import LanguageClient from "@/components/modules/language/LanguageClient";
import { phraseGroups, campusGlossary } from "@/lib/languageData";
import { Languages } from "lucide-react";

export const metadata = {
  title: "Language & Campus Vocabulary – Campus Compass",
};

export default async function LanguagePage() {
  await requireUser("/language");

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 sm:px-0 py-6 sm:py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1.5">
            <Languages size={22} className="text-primary-600 dark:text-primary-400" aria-hidden="true" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Language Help & Campus Glossary
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Survival Hindi phrases with Romanized pronunciation, audio listening, and essential Indian campus terminology.
          </p>
        </div>

        <LanguageClient
          phraseGroups={phraseGroups}
          campusGlossary={campusGlossary}
        />
      </div>
    </AppShell>
  );
}
