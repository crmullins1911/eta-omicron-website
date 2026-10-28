// Placeholder content. Replace with real chapter content, or wire these
// pages up to Supabase tables (see comments in each page component) once
// you're ready to manage this content dynamically.

export const officers = [
  { role: 'Basileus', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
  { role: 'Vice Basileus', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
  { role: 'Keeper of Records and Seal', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
  { role: 'Keeper of Finance', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
  { role: 'Chaplain', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
  { role: 'Keeper of Peace', name: 'Officer Name', bio: 'Chapter history and bio go here.' },
]

export const history = `Eta Omicron Chapter of Omega Psi Phi Fraternity, Inc. has served its
community through the Cardinal Principles of Manhood, Scholarship, Perseverance, and Uplift.
Replace this paragraph with your chapter's founding date, milestones, and notable achievements.`

// Chapter committees. Each gets its own page at /committees/<slug> for forms, applications and posts.
// Keep a committee's slug the same once published: it is the page address and links documents to it.
export const committees = [
  {
    slug: 'achievement-week',
    name: "Achievement Week / Founders' Day Committee",
    description: 'Coordinates national recognition programs and awards for contributions to the community.',
    // Featured programs shown at the top of the committee's page.
    programs: [
      {
        to: '/achievement-week',
        eyebrow: 'November 15–21, 2026',
        title: 'Achievement Week 2026 Schedule',
        text: 'Every event of the week, day by day: times, locations, points of contact and how to give to St. Jude.',
      },
      {
        to: '/essay-contest',
        eyebrow: 'For high school seniors',
        title: 'International High School Essay Contest',
        text: 'This year\'s topic, deadline, scholarship awards, rules and the application to download.',
      },
    ],
  },
  {
    slug: 'social-action',
    name: 'Social Action Committee',
    description: 'Implements community outreach, civic engagement, and social awareness programs.',
  },
  {
    slug: 'health-initiatives',
    name: 'Health Initiatives Committee',
    description:
      'Manages health-focused programming, including blood drives and awareness campaigns (such as the Charles Drew Blood Drive).',
  },
  {
    slug: 'scholarship',
    name: 'Scholarship Committee',
    description: 'Oversees academic grants, financial aid, and scholarship selections for students.',
  },
  {
    slug: 'stem',
    name: 'STEM Committee',
    description: 'Manages educational enrichment, science, technology, engineering, and math initiatives.',
  },
  {
    slug: 'talent-hunt',
    name: 'Talent Hunt Committee',
    description: "Organizes the fraternity's nationally recognized performing arts and talent competition.",
  },
  {
    slug: 'membership',
    name: 'Membership Selection (MSP) Committee',
    description: 'Oversees the intake process and new member education.',
  },
  {
    slug: 'reclamation',
    name: 'Reclamation, Rededication, and Retention Committee',
    description: 'Focuses on re-engaging inactive or displaced brothers back into active chapter life.',
  },
  {
    slug: 'political-action',
    name: 'Political Action Committee',
    description: 'Coordinates voter registration drives, get-out-the-vote efforts, and civil rights partnerships.',
  },
  {
    slug: 'technology',
    name: 'Technology & Webmaster Committee',
    description: 'Maintains digital platforms, chapter communications, and database systems.',
  },
]

export const events = [
  {
    title: 'Chapter Meeting',
    date: '2026-10-04',
    location: 'Chapter House',
    description: 'Monthly chapter business meeting.',
  },
  {
    title: 'Talent Hunt Regional Competition',
    date: '2026-11-15',
    location: 'TBD',
    description: 'Annual scholarship talent competition for local high school students.',
  },
  {
    title: 'Community Service Day',
    date: '2026-12-06',
    location: 'TBD',
    description: 'Chapter-wide day of service.',
  },
]

export const mediaItems = [
  { type: 'image', title: 'Community Service Day 2025', url: '' },
  { type: 'image', title: 'Talent Hunt Finals', url: '' },
  { type: 'video', title: 'Chapter Anniversary Recap', url: '' },
]
