// models/User.js
// Full User schema – passwords never returned by default (select: false).

import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name:            { type: String, required: true, trim: true },
    email:           { type: String, required: true, unique: true, trim: true, lowercase: true },
    // select:false means password is NEVER included in query results unless explicitly requested
    password:        { type: String, required: true, select: false },
    role:            { type: String, enum: ["student", "buddy", "admin"], default: "student" },

    // Personalisation fields
    country:         { type: String, trim: true, default: "" },
    regionGroup:     { type: String, trim: true, default: "" },
    languages:       [{ type: String, trim: true }],
    diet:            { type: String, trim: true, default: "" },   // e.g. halal, vegetarian, vegan, none
    university:      { type: String, trim: true, default: "" },
    visaType:        { type: String, trim: true, default: "" },   // student, dependent, etc.
    arrivalDate:     { type: Date },

    // Buddy / senior fields
    isSenior:        { type: Boolean, default: false },
    openToConnect:   { type: Boolean, default: true },
    bio:             { type: String, trim: true, default: "" },

    // Online presence tracking
    lastSeenAt:      { type: Date, default: null },

    // Onboarding state
    onboardingDone:  { type: Boolean, default: false },

    // Marks row as seed/sample data – never delete real users
    isSample:        { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ── Indexes ────────────────────────────────────────────────────────────────
UserSchema.index({ country: 1 });
UserSchema.index({ isSenior: 1 });
UserSchema.index({ country: 1, isSenior: 1 });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
