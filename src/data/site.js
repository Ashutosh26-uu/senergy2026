// Fest settings. Times are IST.
export const FEST = {
  name: "SYNERGY",
  year: "2026",
  start: "2026-12-05T00:00:00+05:30",     // fest day 1
  starNight: "2026-12-06T00:00:00+05:30", // day 2 + Sachin-Jigar live
  end: "2026-12-07T00:00:00+05:30",
  dateLabel: "5–6 December 2026",
};

// relative asset path: works on localhost and under /senergy2026/ on GitHub Pages
export const A = path => `assets/${path}`;

// gate server (Google Apps Script web app): students download their own pass from it
export const PASS_SERVER = import.meta.env.VITE_PASS_SERVER || "https://script.google.com/macros/s/AKfycbzWIFzj2mr0aExRf6cgs_SWCBz5y1MabjsmO4-T8L-EFk8eWC10CrSA6giBxqIWMloN0A/exec";

export const NAV = [["about", "About"], ["pass", "Get pass"], ["events", "Events"], ["starnight", "Star Night"], ["archive", "Past years"], ["gallery", "Gallery"], ["venue", "Venue"], ["contact", "Contact"]];

export const RING = [
  ["glob_4", "United students on a global exposure tour"], ["audi1", "University auditorium"], ["sport1", "Indoor sports complex"],
  ["yt-synergy-2025", "SYNERGY 2025 with Ankit Tiwari"], ["ban00015", "Students on global exposure tours"], ["ban00049", "Robotics and AI Lab"],
  ["ban00045", "Students selected by Infosys"], ["glob_1", "Student group photo on tour"], ["canteen", "United Canteen"],
  ["ban00020", "Students building a drone in the lab"], ["lib1", "Central library"], ["ban00006", "Students in labs and workshops"], ["gym_1", "Campus gym"],
];

export const MAP = {
  // Google's own "United University | Prayagraj" listing, searched around the campus coordinates
  embed: "https://maps.google.com/maps?q=United+University+Prayagraj&ll=25.3957121,81.7583556&z=15&hl=en&output=embed",
  directions: "https://www.google.com/maps/dir/?api=1&destination=United+University+Prayagraj%2C+Jhalwa%2C+Rawatpur%2C+Prayagraj+211012",
  open: "https://www.google.com/maps/search/?api=1&query=United+University+Prayagraj%2C+Jhalwa%2C+Rawatpur%2C+Prayagraj+211012",
};

// Faculties as named in the Courses menu of uniteduniversity.edu.in (checked 18 Nov 2026)
export const FACULTIES = [
  "Engineering & Technology", "Computer Applications", "Law", "Medical Sciences", "Pharmacy", "Nursing",
  "Agriculture & Allied Sciences", "Commerce & Management", "Mass Communication & Journalism", "Design",
  "Hospitality", "Arts", "Science",
];

export const SOCIALS = [
  ["Instagram", "https://www.instagram.com/united_university"], ["Facebook", "https://www.facebook.com/UnitedUniversity.edu/"],
  ["YouTube", "https://www.youtube.com/@uniteduniversityprayagraj4325"], ["LinkedIn", "https://www.linkedin.com/company/united-university-allahabad/"],
  ["X / Twitter", "https://twitter.com/UnitedUnivers"], ["Website", "https://uniteduniversity.edu.in/"],
];
