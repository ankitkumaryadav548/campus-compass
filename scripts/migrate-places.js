// scripts/migrate-places.js
// Migration script for Prompt 9.11: removes legacy Place documents without osmId
// and ensures new indexes exist. Safe to run multiple times (idempotent).

const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI is not defined. Ensure .env.local exists.");
  process.exit(1);
}

const PlaceSchema = new mongoose.Schema(
  {
    osmType: { type: String, enum: ["node", "way", "relation"] },
    osmId: Number,
    name: String,
    location: { lat: Number, lng: Number },
    ratingAverage: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviews: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        userName: String,
        rating: Number,
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true, strict: false }
);

PlaceSchema.index({ osmType: 1, osmId: 1 }, { unique: true });

const Place = mongoose.models.Place || mongoose.model("Place", PlaceSchema);

async function migrate() {
  console.log("\n🔄  Campus Compass – Place Migration");
  console.log("─".repeat(50));

  await mongoose.connect(MONGODB_URI);
  console.log("✅  Connected to MongoDB\n");

  // 1. Remove legacy place documents with no osmId (sample / old test places)
  const deleteResult = await Place.deleteMany({
    $or: [{ osmId: null }, { osmId: { $exists: false } }],
  });
  console.log(`    Legacy Place documents removed: ${deleteResult.deletedCount}`);

  // 2. Sync indexes
  await Place.syncIndexes();
  console.log("    Place indexes synchronized ({ osmType: 1, osmId: 1 } unique)");

  console.log("\n✅  Place migration complete.\n");
  await mongoose.disconnect();
  process.exit(0);
}

migrate().catch((err) => {
  console.error("\n❌  Migration failed:", err.message);
  process.exit(1);
});
