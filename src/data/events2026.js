// SYNERGY 2026 events, from the official flyers and the official SYNERGY event list. Times are IST.
// reg: register-by date (end of that day) or exact "YYYY-MM-DDTHH:MM".
// register: an online sign-up link, for events whose flyer has no QR code.
// sessions: [start, end, label, venue?]; venue only when a round is held somewhere else.
// End times not given anywhere are estimates (only the start is shown).
// A session with a date and no time (end null) shows as "Time TBA" on that day.
const REG = "2026-11-25"; // registrations extended to 25 Nov

export const EVENTS_2026 = [
  { slug: "decor-dazzler", day: "5", tag: "Décor", title: "Decor Dazzler", desc: "Décor round. Theme: Band Baaja Baaraat", date: "5 Dec 2026", time: "9:30 – 11:30 AM", venue: "Open Area Venues", sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "rangsrijan", day: "5", tag: "Rangoli", title: "Rangsrijan", desc: "Rangoli competition: let colours tell a story", date: "5 Dec 2026", time: "9:30 – 11:30 AM", venue: "University Reception Area / Fashion Lab", reg: REG, sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "tshirt-painting", day: "5", tag: "Art", title: "T-Shirt Painting", desc: "Paint. Design. Wear.", date: "5 Dec 2026", time: "9:30 – 11:30 AM", venue: "University Reception Area / Fashion Lab", sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "unichef", day: "5", tag: "Food", title: "UniChef", desc: "Master Chef: cook, create, compete. First round on 23 Nov, final on 5 Dec", date: "1st round 23 Nov · Final 5 Dec", time: "Final: 9:30 AM – 1 PM", venue: "Hotel Management Department", sessions: [["2026-11-23", null, "1st round"], ["2026-12-05T09:30", "2026-12-05T13:00", "Final round"]] },
  { slug: "war-of-bands", day: "5", tag: "Music", title: "War of Bands: Sound Surge", desc: "Battle of the bands", date: "5 Dec 2026", time: "10 AM – 12 Noon", venue: "UU Auditorium", reg: REG, sessions: [["2026-12-05T10:00", "2026-12-05T12:00", ""]] },
  { slug: "mehndi-magic", day: "5", tag: "Art", title: "Mehndi Magic × Spooky Ink", desc: "Mehndi (theme: Indian festivals) and tattoo (theme: Halloween)", date: "5 Dec 2026", time: "12:00 – 1:30 PM", venue: "Foyer of LT6, UIMS", sessions: [["2026-12-05T12:00", "2026-12-05T13:30", ""]] },
  { slug: "bollywood-rewind", day: "5", tag: "Performance", title: "Bollywood Rewind", desc: "Recreate the magic of cinema", date: "5 Dec 2026", time: "12 – 2 PM", venue: "UU Auditorium", sessions: [["2026-12-05T12:00", "2026-12-05T14:00", ""]] },
  { slug: "united-arena", day: "5", tag: "Gaming", title: "United Arena", desc: "BGMI, Counter-Strike 2 and Smash Karts", date: "Qualifiers 4 Dec · Finals 5 Dec", time: "12 – 3 PM · 1 – 4 PM", venue: "Computer Labs, University Building", reg: REG, sessions: [["2026-12-04T12:00", "2026-12-04T15:00", "Qualifiers"], ["2026-12-05T13:00", "2026-12-05T16:00", "Grand Finals"]] },
  { slug: "spell-bee", day: "5", tag: "Words", title: "Spell Bee 3.0", desc: "The spelling championship returns", date: "5 Dec 2026", time: "12:30 – 2:00 PM", venue: "LT 3, UIMS", sessions: [["2026-12-05T12:30", "2026-12-05T14:00", ""]] },
  { slug: "rhythm-rumble", day: "5", tag: "Dance", title: "Rhythm Rumble", desc: "Dance United Dance: solo and group dance competition. Theme: Era of Indian Cinema", date: "5 Dec 2026", time: "2 – 4 PM", venue: "Sports Complex", sessions: [["2026-12-05T14:00", "2026-12-05T16:00", ""]] },
  { slug: "anantya", day: "5", tag: "Fashion", title: "Anantya: The Timeless Saga", desc: "Fashion show: heritage, legends and fashion", date: "5 Dec 2026", time: "4 – 5 PM", venue: "Sports Complex", sessions: [["2026-12-05T16:00", "2026-12-05T17:00", ""]] },
  { slug: "bhajan-jamming", day: "6", tag: "Devotional", title: "Bhajan Jamming", desc: "Bring your voice, bring your team, let the bhakti flow. From soulful classics to high-energy devotional fusion", date: "6 Dec 2026", time: "9:30 AM – 12 Noon", venue: "Sports Complex", register: "https://forms.gle/HjQJU3LNcmbEsnPo8", sessions: [["2026-12-06T09:30", "2026-12-06T12:00", ""]] },
  { slug: "tamasha", day: "6", tag: "Drama", title: "Tamasha", desc: "Drama and theatre skits (screening on 26 Nov)", date: "6 Dec 2026", time: "10 AM – 12 Noon", venue: "UU Auditorium", reg: REG, sessions: [["2026-12-06T10:00", "2026-12-06T12:00", ""]] },
  { slug: "brain-quest", day: "6", tag: "Quiz", title: "BrainQuest", desc: "Quiz competition: screening round on 2 Dec, main round on 6 Dec", date: "Screening 2 Dec · Main round 6 Dec", time: "12 PM · 10 AM – 12 PM", venue: "LT3 / LT4, UIMS", sessions: [["2026-12-02T12:00", "2026-12-02T13:00", "Screening round"], ["2026-12-06T10:00", "2026-12-06T12:00", "Main round"]] },
  { slug: "poster-making", day: "6", tag: "Art", title: "Poster / Collage Making", desc: "Themes: Viksit Bharat @2047, climate change and sustainability, knowledge without walls", date: "6 Dec 2026", time: "11 AM – 1 PM", venue: "Display at UIMS Lawns", reg: REG, sessions: [["2026-12-06T11:00", "2026-12-06T13:00", ""]] },
  { slug: "clay-modelling", day: "6", tag: "Art", title: "Clay Modelling", desc: "Where creativity takes shape", date: "6 Dec 2026", time: "11 AM – 12:30 PM", venue: "Hall adjacent to LT6, UIMS", reg: REG, sessions: [["2026-12-06T11:00", "2026-12-06T12:30", ""]] },
  { slug: "jam", day: "6", tag: "Speaking", title: "JAM: Just A Minute", desc: "One minute. One mic. One chance.", date: "6 Dec 2026", time: "12 – 2 PM", venue: "LT3 / LT4, UIMS", reg: REG, sessions: [["2026-12-06T12:00", "2026-12-06T14:00", ""]] },
  { slug: "swar-sangam", day: "6", tag: "Singing", title: "Swar Sangam", desc: "Singing competition, solo and group", date: "6 Dec 2026", time: "12 – 2 PM", venue: "UU Auditorium", sessions: [["2026-12-06T12:00", "2026-12-06T14:00", ""]] },
  { slug: "junkyard", day: "6", tag: "Upcycling", title: "Best of Waste: Junkyard", desc: "Theme: Jugaad Junction, Indian-style DIY creations", date: "6 Dec 2026", time: "12:30 – 2:30 PM", venue: "Hall adjacent to LT6, UIMS", reg: REG, sessions: [["2026-12-06T12:30", "2026-12-06T14:30", ""]] },
  { slug: "click-and-roll", day: "online", tag: "Photo & Reels", title: "Click & Roll", desc: "Photography and reel making: online entries, shortlist on 2 Dec, then on-spot mobile photography rounds on both fest days", date: "Submit by 28 Nov, 4 PM · On-spot 5 & 6 Dec", time: "Online · 10 AM (5 Dec) · 11 AM (6 Dec)", venue: "Online · Conference Hall, 2nd Floor, University Building", reg: "2026-11-28T16:00", sessions: [["2026-11-28T15:00", "2026-11-28T16:00", "Submission deadline", "Online"], ["2026-12-05T10:00", "2026-12-05T12:00", "On-spot round 1", "Conference Hall, 2nd Floor, University Building"], ["2026-12-06T11:00", "2026-12-06T12:00", "On-spot round 2", "Conference Hall, 2nd Floor, University Building"]] },
];

// card image sizes (for layout without jumps)
export const FLYER_CARD_SIZE = {
  "decor-dazzler": [560, 751], rangsrijan: [533, 800], "tshirt-painting": [534, 800], "war-of-bands": [560, 791],
  "mehndi-magic": [540, 800], "united-arena": [560, 750], "spell-bee": [560, 747], tamasha: [560, 700],
  unichef: [533, 800], "bollywood-rewind": [451, 800], "rhythm-rumble": [533, 800], anantya: [560, 793],
  junkyard: [560, 793], "brain-quest": [533, 800], "poster-making": [560, 747], "clay-modelling": [533, 800],
  jam: [560, 793], "swar-sangam": [560, 790], "click-and-roll": [448, 800], "bhajan-jamming": [534, 800],
};

// Day 2 evening at the Sports Complex (from the official event list)
export const EVENING = [
  { title: "Pre Band Night Show", start: "2026-12-06T18:00", end: "2026-12-06T19:00", venue: "Sports Complex" },
  { title: "Star Night: Sachin-Jigar LIVE", start: "2026-12-06T19:00", end: "2026-12-06T23:00", venue: "Sports Complex", star: true },
];
