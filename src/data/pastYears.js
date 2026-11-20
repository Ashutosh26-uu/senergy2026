// Past editions: SYNERGY 2025 event cards and the per-year photo galleries.
export const EVENTS_2025 = [
  { flyer: "rhythm-rumble", photo: "rhythm-rumble", day: "28", tag: "Dance", title: "Rhythm Rumble Reloaded", desc: "Dance competition (auditions held on 26 November)", time: "Friday", venue: "United University" },
  { flyer: "war-of-bands", photo: "war-of-bands", day: "28", tag: "Music", title: "War of Bands: Sound Surge", desc: "Band battle, UU × UIMS", time: "10 AM – 12 PM", venue: "UU New Auditorium" },
  { flyer: "rangavalli", photo: "rangavalli", day: "28", tag: "Art", title: "Rangavalli", desc: "Rangoli competition", time: "9:30 – 11:30 AM", venue: "Fashion Lab / UU Reception Area" },
  { flyer: "tshirt-painting", photo: "tshirt-painting", day: "28", tag: "Art", title: "T-Shirt Painting Competition", desc: "Splash your imagination", time: "9:30 – 11:30 AM", venue: "Fashion Lab / UU Reception Area" },
  { flyer: "brain-booster", photo: "brain-booster", day: "29", tag: "Quiz", title: "Brain Booster: Main Round", desc: "Final round of the quiz", time: "10 AM – 12 PM", venue: "Old UU Auditorium" },
  { flyer: "tattoo", photo: "tattoo", day: "29", tag: "Art", title: "Tattoo Competition", desc: "Ink it. Draw it. Own it. Victory is in your hands!", time: "11 AM – 12 PM", venue: "Lawn near Hanuman Ji statue, UIMS" },
  { flyer: "jam", photo: "jam", day: "29", tag: "Speaking", title: "JAM: Just A Minute", desc: "One minute. One mic. One chance.", time: "Saturday", venue: "UU Moot Court" },
  { flyer: "directors-cut", photo: "directors-cut", day: "29", tag: "Fashion", title: "Director's Cut: Draping & Fashion Show", desc: "Theme: Era of Indian Cinema", time: "Saturday", venue: "United University" },
  { flyer: "live-performance", photo: "starnight", day: "29", tag: "Live", title: "Star Night: Ankit Tiwari LIVE", desc: "Our playlists are about to come alive", time: "Night", venue: "Main ground" },
];

// [slug, title, subtitle]; every photo is 3:2 except the ones listed in SIZES
const g = items => items.map(([slug, title, sub = ""]) => ({ slug, title, sub }));
export const GALLERY = {
  2025: {
    title: "SYNERGY 2025", dates: "28–29 November 2025 · Ankit Tiwari LIVE", logo: "synergy-2025.svg",
    days: [
      ["Day 1 · 28 Nov", g([["opening", "Fest declared open"], ["opening-2", "Opening address"], ["campus-letters", "Opening day"], ["war-of-bands", "War of Bands", "Music"], ["war-of-bands-2", "War of Bands", "Music"], ["rangavalli", "Rangavalli", "Rangoli"], ["rangavalli-2", "Rangavalli", "Rangoli"], ["tshirt-painting", "T-Shirt Painting"], ["tshirt-painting-2", "T-Shirt Painting"], ["face-painting", "Face painting"], ["face-painting-2", "Face painting"], ["masterchef", "Master Chef", "Food"], ["photo-booth", "Fest décor", "Photo booth"], ["fun-fair", "Stalls & fun fair"]])],
      ["Day 2 · 29 Nov", g([["brain-booster", "Brain Booster", "Quiz winners"], ["brain-booster-2", "Brain Booster", "Quiz winners"], ["jam", "JAM: Just A Minute", "Moot Court"], ["tattoo", "Tattoo Competition"], ["junkyard", "Junkyard", "Best out of waste"], ["junkyard-2", "Junkyard", "Best out of waste"], ["poster-making", "Poster making"], ["tarangam", "Tarangam", "Singing"], ["tarangam-2", "Tarangam", "Singing"], ["rhythm-rumble", "Rhythm Rumble Reloaded", "Dance"], ["rhythm-rumble-2", "Rhythm Rumble Reloaded", "Dance"], ["crowd", "A full house"], ["directors-cut", "Director's Cut", "Fashion show"], ["fashion", "Director's Cut", "Fashion show"], ["fashion-2", "Director's Cut", "Fashion show"], ["fashion-lineup", "Director's Cut", "Fashion show"]])],
      ["Star Night: Ankit Tiwari LIVE · 29 Nov", g([["starnight-stage", "Star Night"], ["starnight", "Ankit Tiwari LIVE"], ["starnight-arms", "Ankit Tiwari LIVE"], ["starnight-name", "Ankit Tiwari LIVE"], ["starnight-red", "Ankit Tiwari LIVE"], ["starnight-sing", "Ankit Tiwari LIVE"], ["starnight-purple", "Ankit Tiwari LIVE"], ["starnight-duet", "Ankit Tiwari LIVE"], ["starnight-duet-2", "Ankit Tiwari LIVE"], ["starnight-song", "Ankit Tiwari LIVE"], ["starnight-sadda-haq", "Ankit Tiwari LIVE"], ["phone-lights", "Phone lights up", "The crowd"]])],
    ],
  },
  2024: {
    title: "SYNERGY 2024", dates: "16–17 November 2024 · Sreerama Chandra LIVE", logo: "synergy-2024-logo.png", darkLogo: true,
    days: [
      ["Pre-fest · 15 Nov", g([["photo-booth", "Fest décor", "Photo booth"], ["decor-train", "Department décor", "Décor round"]])],
      ["Day 1 · 16 Nov", g([["opening", "Opening ceremony"], ["lamp-lighting", "Lamp lighting"], ["audience", "A packed hall"], ["rhythm-rumble", "Rhythm Rumble", "Dance"], ["rhythm-rumble-2", "Rhythm Rumble", "Dance"], ["masterchef", "Master Chef", "Food"], ["masterchef-judging", "Master Chef", "Judging"], ["spell-bee", "Spell Bee Championship", "Winners"], ["spell-bee-2", "Spell Bee Championship", "Winners"], ["shutter-story", "Shutter Story", "Photography"], ["shutter-story-2", "Shutter Story", "Winners"]])],
      ["Day 2 · 17 Nov", g([["arena", "Arena", "Winners"], ["beatboxing", "Rap & Beatbox"], ["beatboxing-2", "Rap & Beatbox"], ["brain-blast", "Brain Blast", "Quiz"], ["floor-fiesta", "Floor Fiesta", "Rangoli"], ["floor-fiesta-2", "Floor Fiesta", "Rangoli"], ["junkyard", "Junkyard", "Best out of waste"], ["junkyard-2", "Junkyard", "Best out of waste"], ["tarangam", "Tarangam"]])],
      ["Star Night: Sreerama Chandra LIVE · 17 Nov", g([["stage-setup", "The stage", "Before the show"], ["starnight-stage", "Star Night", "Lights up"], ["bandnight", "Sreerama Chandra LIVE"], ["bandnight-crowd", "Sreerama Chandra LIVE"], ["starnight-crowd", "Sreerama Chandra LIVE"], ["starnight-fans", "The crowd"], ["starnight-red", "Sreerama Chandra LIVE"], ["starnight-light", "Sreerama Chandra LIVE"], ["starnight-close", "Sreerama Chandra LIVE"], ["starnight-walk", "Sreerama Chandra LIVE"]])],
    ],
  },
};

// natural sizes of the -sm files that are not 700×467
export const SIZES = { "2024/photo-booth": [533, 700], "2025/tattoo": [700, 393] };
export const shotSize = (year, slug) => SIZES[`${year}/${slug}`] || [700, 467];

export const PREVIEW = [
  ["2025", "starnight-stage", "Star Night 2025", "Ankit Tiwari LIVE"], ["2024", "photo-booth", "SYNERGY 2024", "Fest décor"],
  ["2025", "opening", "SYNERGY 2025", "Declared open"], ["2024", "starnight-crowd", "Sreerama Chandra LIVE", "Star Night 2024"],
  ["2025", "fashion-lineup", "Director's Cut 2025", "Fashion show"], ["2024", "rhythm-rumble", "Rhythm Rumble 2024", "Dance"],
  ["2025", "phone-lights", "Star Night 2025", "Phone lights up"], ["2024", "spell-bee", "Spell Bee 2024", "Winners"],
];

export const EDITIONS = [
  { year: "2024", logo: "synergy-2024-logo.png", dark: true, sub: "16–17 Nov · Sreerama Chandra LIVE", theme: "Pulse of United" },
  { year: "2025", logo: "synergy-2025.svg", sub: "28–29 Nov · Ankit Tiwari LIVE", theme: "Let the Synergy Ignite" },
  { year: "2026", logo: "synergy-2026.svg", sub: "5–6 Dec · Sachin-Jigar LIVE", theme: "Coming up", now: true },
];
