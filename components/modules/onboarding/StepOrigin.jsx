"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, X, Globe, MessageSquare } from "lucide-react";
import { countries, languageOptions } from "@/lib/countries";
import Badge from "@/components/ui/Badge";

export default function StepOrigin({ formData, onChange, errors }) {
  const [countryQuery, setCountryQuery] = useState(formData.country || "");
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const countryDropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const filteredCountries = countries.filter((c) =>
    c.name.toLowerCase().includes(countryQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        countryDropdownRef.current &&
        !countryDropdownRef.current.contains(event.target)
      ) {
        setIsCountryOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectCountry = (country) => {
    onChange("country", country.name);
    setCountryQuery(country.name);
    setIsCountryOpen(false);
  };

  const handleCountryKeyDown = (e) => {
    if (!isCountryOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsCountryOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredCountries.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCountries[highlightedIndex]) {
        selectCountry(filteredCountries[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsCountryOpen(false);
    }
  };

  const toggleLanguage = (lang) => {
    const current = formData.languages || [];
    if (current.includes(lang)) {
      onChange(
        "languages",
        current.filter((item) => item !== lang)
      );
    } else {
      if (current.length >= 5) return;
      onChange("languages", [...current, lang]);
    }
  };

  const removeLanguage = (lang) => {
    const current = formData.languages || [];
    onChange(
      "languages",
      current.filter((item) => item !== lang)
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center max-w-md mx-auto mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Where are you from?
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Your home country determines your personalized guide steps, buddy suggestions, and food recommendations.
        </p>
      </div>

      <div className="space-y-2 relative" ref={countryDropdownRef}>
        <label
          htmlFor="country-input"
          className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
        >
          <Globe size={16} className="text-primary-600" />
          Home Country
        </label>

        <div className="relative">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>

          <input
            id="country-input"
            ref={searchInputRef}
            type="text"
            role="combobox"
            value={countryQuery}
            onChange={(e) => {
              setCountryQuery(e.target.value);
              setIsCountryOpen(true);
              setHighlightedIndex(0);
              if (formData.country && formData.country !== e.target.value) {
                onChange("country", "");
              }
            }}
            onFocus={() => setIsCountryOpen(true)}
            onKeyDown={handleCountryKeyDown}
            placeholder="Type your country name..."
            autoComplete="off"
            className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-h-[44px]"
            aria-expanded={isCountryOpen}
            aria-autocomplete="list"
            aria-controls="country-options-list"
          />

          <button
            type="button"
            onClick={() => {
              setIsCountryOpen((prev) => !prev);
              searchInputRef.current?.focus();
            }}
            aria-label="Toggle country list"
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            <ChevronDown size={18} />
          </button>
        </div>

        {errors?.country && (
          <p className="text-xs text-danger-600 dark:text-danger-400 mt-1">
            {errors.country}
          </p>
        )}

        {isCountryOpen && (
          <ul
            id="country-options-list"
            role="listbox"
            className="absolute z-30 left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl py-1 text-sm"
          >
            {filteredCountries.length > 0 ? (
              filteredCountries.map((c, idx) => (
                <li
                  key={c.name}
                  role="option"
                  aria-selected={formData.country === c.name}
                  onClick={() => selectCountry(c)}
                  className={`px-4 py-2.5 cursor-pointer flex items-center justify-between transition-colors min-h-[44px] ${
                    idx === highlightedIndex
                      ? "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>{c.name}</span>
                  <span className="text-xs text-slate-400">{c.regionGroup}</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-xs text-slate-500 text-center">
                No matching country found.
              </li>
            )}
          </ul>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageSquare size={16} className="text-primary-600" />
            Languages you speak
          </label>
          <span className="text-xs text-slate-400">
            {formData.languages?.length || 0}/5 selected
          </span>
        </div>

        {formData.languages?.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
            {formData.languages.map((lang) => (
              <Badge
                key={lang}
                variant="info"
                className="pl-3 pr-1.5 py-1 text-xs gap-1 flex items-center"
              >
                <span>{lang}</span>
                <button
                  type="button"
                  onClick={() => removeLanguage(lang)}
                  aria-label={`Remove ${lang}`}
                  className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {errors?.languages && (
          <p className="text-xs text-danger-600 dark:text-danger-400">
            {errors.languages}
          </p>
        )}

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
          {languageOptions.map((lang) => {
            const isSelected = formData.languages?.includes(lang);
            return (
              <button
                key={lang}
                type="button"
                onClick={() => toggleLanguage(lang)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 min-h-[38px] ${
                  isSelected
                    ? "bg-primary-600 text-white border-primary-600 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-primary-400"
                }`}
              >
                {lang}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
