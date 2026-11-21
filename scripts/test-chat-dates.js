// scripts/test-chat-dates.js
// Verification tests for lib/chatDates.js

import assert from "node:assert/strict";
import {
  dayLabel,
  listTimeLabel,
  timeOfDay,
  lastSeenLabel,
  groupByDay,
} from "../lib/chatDates.js";

console.log("Running chat dates tests...");

// Base reference: Wednesday, 18 Nov 2026, 15:30:00 local time
const baseNow = new Date(2026, 10, 18, 15, 30, 0); // Note month is 0-indexed: 10 = November

// 1. Today
const todayMsg = new Date(2026, 10, 18, 9, 15, 0);
assert.equal(dayLabel(todayMsg, baseNow), "Today");
assert.equal(listTimeLabel(todayMsg, baseNow), "9:15 AM");
assert.equal(lastSeenLabel(todayMsg, baseNow), "last seen today at 9:15 AM");

// 2. Yesterday
const yesterdayMsg = new Date(2026, 10, 17, 21, 10, 0);
assert.equal(dayLabel(yesterdayMsg, baseNow), "Yesterday");
assert.equal(listTimeLabel(yesterdayMsg, baseNow), "Yesterday");
assert.equal(lastSeenLabel(yesterdayMsg, baseNow), "last seen yesterday at 9:10 PM");

// 3. Weekday (2 to 6 days ago)
// Monday 16 Nov 2026 is 2 days before Wednesday 18 Nov 2026
const mondayMsg = new Date(2026, 10, 16, 16, 32, 0);
assert.equal(dayLabel(mondayMsg, baseNow), "Monday");
assert.equal(listTimeLabel(mondayMsg, baseNow), "Monday");
assert.equal(lastSeenLabel(mondayMsg, baseNow), "last seen Monday at 4:32 PM");

// Friday 13 Nov 2026 is 5 days before Wednesday 18 Nov 2026
const fridayMsg = new Date(2026, 10, 13, 11, 0, 0);
assert.equal(dayLabel(fridayMsg, baseNow), "Friday");
assert.equal(listTimeLabel(fridayMsg, baseNow), "Friday");

// 4. Old date (> 6 days ago)
// 10 Nov 2026 is 8 days before 18 Nov 2026
const oldMsg = new Date(2026, 10, 10, 14, 20, 0);
assert.equal(dayLabel(oldMsg, baseNow), "10 Nov 2026");
assert.equal(listTimeLabel(oldMsg, baseNow), "10/11/2026");
assert.equal(lastSeenLabel(oldMsg, baseNow), "last seen 10 Nov 2026");

// 5. Empty / null lastSeenAt
assert.equal(lastSeenLabel(null, baseNow), "");
assert.equal(lastSeenLabel(undefined, baseNow), "");

// 6. Midnight Boundary: Message at 11:50 PM compared with now at 12:10 AM next day
const lateNight = new Date(2026, 10, 18, 23, 50, 0);
const earlyNextDay = new Date(2026, 10, 19, 0, 10, 0);
assert.equal(
  dayLabel(lateNight, earlyNextDay),
  "Yesterday",
  "Message sent at 11:50 PM must show as Yesterday at 12:10 AM next day"
);
assert.equal(listTimeLabel(lateNight, earlyNextDay), "Yesterday");
assert.equal(
  lastSeenLabel(lateNight, earlyNextDay),
  "last seen yesterday at 11:50 PM"
);

// 7. Group by Day
const sampleMessages = [
  { _id: "1", text: "Old msg", createdAt: oldMsg },
  { _id: "2", text: "Yesterday msg 1", createdAt: yesterdayMsg },
  { _id: "3", text: "Yesterday msg 2", createdAt: new Date(2026, 10, 17, 22, 0, 0) },
  { _id: "4", text: "Today msg", createdAt: todayMsg },
];
const groups = groupByDay(sampleMessages, baseNow);
assert.equal(groups.length, 3);
assert.equal(groups[0].dayLabel, "10 Nov 2026");
assert.equal(groups[0].messages.length, 1);
assert.equal(groups[1].dayLabel, "Yesterday");
assert.equal(groups[1].messages.length, 2);
assert.equal(groups[2].dayLabel, "Today");
assert.equal(groups[2].messages.length, 1);

console.log("All chat dates tests passed successfully!");
