// lib/campus.js
// Single source of truth for campus name and geographic coordinates.
// Used by both the Next.js application and the database seed script.

const CAMPUS_NAME = "Sample City University";
const CAMPUS_LAT = 28.6139;
const CAMPUS_LNG = 77.2090;
const CAMPUS_COORDS = { lat: CAMPUS_LAT, lng: CAMPUS_LNG };

module.exports = {
  CAMPUS_NAME,
  CAMPUS_LAT,
  CAMPUS_LNG,
  CAMPUS_COORDS,
  default: {
    CAMPUS_NAME,
    CAMPUS_LAT,
    CAMPUS_LNG,
    CAMPUS_COORDS,
  },
};
