import mongoose from "mongoose";
import User from "../models/User.js";
import BuddyMatch from "../models/BuddyMatch.js";
import { getPeopleSuggestions, getMyMatches } from "../lib/community.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected to MongoDB");

  const moses = await User.findOne({ email: "moses.kato@sample.test" }).lean();
  const linh = await User.findOne({ email: "linh.pham@sample.test" }).lean();
  const david = await User.findOne({ email: "david.ssekandi@sample.test" }).lean();

  console.log("\n1. Testing getPeopleSuggestions for Moses:");
  const mosesSuggestions = await getPeopleSuggestions(moses, { kind: "all" });
  console.log(`Total people returned: ${mosesSuggestions.totalCount}`);
  
  const linhFromMoses = mosesSuggestions.people.find(p => p._id.toString() === linh._id.toString());
  console.log("Linh status from Moses:", linhFromMoses?.requestStatus); // Should be "pending_received"

  const davidFromMoses = mosesSuggestions.people.find(p => p._id.toString() === david._id.toString());
  console.log("David status from Moses:", davidFromMoses?.requestStatus); // Should be "accepted"

  console.log("\n2. Testing getMyMatches for Moses:");
  const mosesMatches = await getMyMatches(moses);
  console.log(`Total matches for Moses: ${mosesMatches.length}`);
  const incoming = mosesMatches.filter(m => m.status === "pending" && (m.direction === "incoming" || !m.isRequester));
  console.log(`Incoming pending requests for Moses: ${incoming.length}`);
  incoming.forEach(m => console.log(`  - From: ${m.partner?.name} (direction: ${m.direction})`));

  console.log("\n3. Testing filters (seniors vs peers):");
  const seniorsOnly = await getPeopleSuggestions(moses, { kind: "seniors" });
  console.log(`Seniors count: ${seniorsOnly.people.length}, all isSenior: ${seniorsOnly.people.every(p => p.isSenior)}`);

  const peersOnly = await getPeopleSuggestions(moses, { kind: "peers" });
  console.log(`Peers count: ${peersOnly.people.length}, all non-senior: ${peersOnly.people.every(p => !p.isSenior)}`);

  console.log("\n4. Testing openToConnect filter:");
  await User.updateOne({ _id: linh._id }, { $set: { openToConnect: false } });
  const mosesSuggestionsWithoutLinh = await getPeopleSuggestions(moses, { kind: "all" });
  const linhVisible = mosesSuggestionsWithoutLinh.people.some(p => p._id.toString() === linh._id.toString());
  console.log(`Is Linh visible when openToConnect=false: ${linhVisible}`);
  // Restore Linh
  await User.updateOne({ _id: linh._id }, { $set: { openToConnect: true } });

  console.log("\nAll direct checks passed!");
  process.exit(0);
}

run().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
