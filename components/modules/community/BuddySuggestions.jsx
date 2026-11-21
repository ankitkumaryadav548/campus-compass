"use client";
// components/modules/community/BuddySuggestions.jsx
// Backward-compatible wrapper delegating to PeopleSection.

import PeopleSection from "./PeopleSection";

export default function BuddySuggestions({
  suggestions,
  initialData,
  userCountry,
  currentUser,
  noContentBannerText,
  onConnectionsChanged,
}) {
  const data = initialData || {
    people: Array.isArray(suggestions) ? suggestions : suggestions?.people || [],
    hasMore: Boolean(suggestions?.hasMore),
    nextOffset: suggestions?.nextOffset ?? 12,
  };

  return (
    <PeopleSection
      initialData={data}
      currentUser={currentUser || { country: userCountry }}
      noContentBannerText={noContentBannerText}
      onConnectionsChanged={onConnectionsChanged}
    />
  );
}
