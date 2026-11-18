// SYNERGY 2026 events, from the official flyers. Times are IST.
// reg: register-by date (end of that day) or exact "YYYY-MM-DDTHH:MM".
// sessions: [start, end, label]; end times not printed on a flyer are estimates (only start is shown).
export const EVENTS_2026 = [
  { slug: "decor-dazzler", day: "5", tag: "Décor", title: "Decor Dazzler", desc: "Theme: Band Baaja Baaraat", date: "5 Dec 2026", time: "9:30 AM", venue: "Open Ground", sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "rangsrijan", day: "5", tag: "Rangoli", title: "Rangsrijan", desc: "Rangoli competition: let colours tell a story", date: "5 Dec 2026", time: "9:30 – 11:30 AM", venue: "University Reception Area / Fashion Lab", reg: "2026-11-22", sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "tshirt-painting", day: "5", tag: "Art", title: "T-Shirt Painting", desc: "Paint. Design. Wear.", date: "5 Dec 2026", time: "9:30 – 11:30 AM", venue: "Fashion Designing Lab", sessions: [["2026-12-05T09:30", "2026-12-05T11:30", ""]] },
  { slug: "war-of-bands", day: "5", tag: "Music", title: "War of Bands: Sound Surge", desc: "Battle of the bands", date: "5 Dec 2026", time: "10:00 AM", venue: "New Auditorium", reg: "2026-11-22", sessions: [["2026-12-05T10:00", "2026-12-05T13:00", ""]] },
  { slug: "mehndi-magic", day: "5", tag: "Art", title: "Mehndi Magic × Spooky Ink", desc: "Mehndi (theme: Indian festivals) and tattoo (theme: Halloween)", date: "5 Dec 2026", time: "12:00 – 1:30 PM", venue: "Foyer of LT6, UIMS", sessions: [["2026-12-05T12:00", "2026-12-05T13:30", ""]] },
  { slug: "united-arena", day: "5", tag: "Gaming", title: "United Arena", desc: "BGMI, Counter-Strike 2 and Smash Karts", date: "Qualifiers 4 Dec · Finals 5 Dec", time: "12 – 3 PM · 12 – 4 PM", venue: "Computer Labs, CSE Department", reg: "2026-11-25", sessions: [["2026-12-04T12:00", "2026-12-04T15:00", "Qualifiers"], ["2026-12-05T12:00", "2026-12-05T16:00", "Grand Finals"]] },
  { slug: "spell-bee", day: "5", tag: "Words", title: "Spell Bee 3.0", desc: "The spelling championship returns", date: "5 Dec 2026", time: "12:30 – 2:00 PM", venue: "LT 3, UIMS", sessions: [["2026-12-05T12:30", "2026-12-05T14:00", ""]] },
  { slug: "anantya", day: "5", tag: "Fashion", title: "Anantya: The Timeless Saga", desc: "Heritage, legends and fashion", date: "5 Dec 2026", time: "4 PM onwards", venue: "SYNERGY Ground", sessions: [["2026-12-05T16:00", "2026-12-05T18:30", ""]] },
  { slug: "junkyard", day: "tba", tag: "Upcycling", title: "Best of Waste: Junkyard", desc: "Theme: Jugaad Junction, Indian-style DIY creations", date: "To be announced", time: "12:30 – 2:30 PM", venue: "Hall next to LT6, UIMS", reg: "2026-11-22", sessions: [] },
  { slug: "tamasha", day: "6", tag: "Drama", title: "Tamasha", desc: "Drama and theatre skits (screening on 26 Nov)", date: "6 Dec 2026", time: "10 AM – 12 Noon", venue: "New Auditorium, 3rd Floor, UU", reg: "2026-11-24", sessions: [["2026-12-06T10:00", "2026-12-06T12:00", ""]] },
  { slug: "clay-modelling", day: "6", tag: "Art", title: "Clay Modelling", desc: "Where creativity takes shape", date: "6 Dec 2026", time: "11 AM – 12:30 PM", venue: "Hall next to LT6, UIMS", reg: "2026-11-22", sessions: [["2026-12-06T11:00", "2026-12-06T12:30", ""]] },
  { slug: "jam", day: "6", tag: "Speaking", title: "JAM: Just A Minute", desc: "One minute. One mic. One chance.", date: "6 Dec 2026", time: "12 – 2 PM", venue: "LT3, UIMS", reg: "2026-11-22", sessions: [["2026-12-06T12:00", "2026-12-06T14:00", ""]] },
  { slug: "swar-sangam", day: "6", tag: "Singing", title: "Swar Sangam", desc: "Unleash the music within", date: "6 Dec 2026", time: "12:00 PM", venue: "UU Auditorium", sessions: [["2026-12-06T12:00", "2026-12-06T14:00", ""]] },
  { slug: "click-and-roll", day: "online", tag: "Photo & Reels", title: "Click & Roll", desc: "Photography and reel-making competition; shortlist out on 2 Dec", date: "Submit by 28 Nov, 4 PM", time: "Online entry", venue: "Online", reg: "2026-11-28T16:00", sessions: [["2026-11-28T15:00", "2026-11-28T16:00", "Submission deadline"]] },
];

// card image sizes (for layout without jumps)
export const FLYER_CARD_SIZE = {
  "decor-dazzler": [560, 751], rangsrijan: [533, 800], "tshirt-painting": [534, 800], "war-of-bands": [560, 791],
  "mehndi-magic": [540, 800], "united-arena": [560, 685], "spell-bee": [560, 747], anantya: [560, 793],
  junkyard: [560, 793], tamasha: [560, 700], "clay-modelling": [533, 800], jam: [560, 793],
  "swar-sangam": [560, 790], "click-and-roll": [448, 800],
};

export const STAR_NIGHT = { title: "Star Night: Sachin-Jigar LIVE", start: "2026-12-06T19:00", end: "2026-12-06T23:00", venue: "Main ground" };
