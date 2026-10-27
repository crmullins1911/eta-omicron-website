// High School Essay Contest page (/essay-contest), part of Achievement Week.
//
// TO UPDATE FOR A NEW YEAR: put the new application PDF in /public/files/, then change `year`,
// `pdf`, `topic`, `deadline`, `deadlineText` and anything else below that changed. Everything on
// the page (and the Home page notice) comes from this file. After the deadline passes, the page
// says applications are closed and the Home page notice disappears on its own.

export const essayContest = {
  year: '2026–2027',
  // The application packet visitors download.
  pdf: '/files/2026-2027-high-school-essay-contest-application.pdf',
  pdfPages: 9,

  topic: 'How Can Young People Use Leadership, Service, and Innovation to Create Positive Change in Their Communities?',

  // Deadline for applications to reach this chapter. `deadline` is used to count down and to close
  // the page; `deadlineText` is what visitors read.
  deadline: '2026-10-31T23:59:00-04:00',
  deadlineText: 'October 31, 2026 at 11:59 p.m.',

  // Where students send their completed application (email only; mailed paper copies are not
  // accepted). Change this if the Achievement Week committee uses a different address.
  submitEmail: 'info@etaomicron.org',
  contactName: '', // e.g. 'Bro. John Smith, Achievement Week Chairman'
  contactPhone: '',

  wordCount: '700–750 words',

  internationalAwards: [
    { place: '1st Place', amount: '$5,000' },
    { place: '2nd Place', amount: '$3,000' },
    { place: '3rd Place', amount: '$2,000' },
    { place: '4th Place', amount: '$1,000' },
  ],
  awardsNote:
    'The contest starts at the chapter level. Chapter winners advance to the District, and District winners compete Internationally. Chapter and District awards vary and may or may not be monetary.',

  eligibility: [
    'You are a college-bound high school senior.',
    'You attend a public, private or qualifying home-school program.',
    'Eta Omicron is the closest chapter to your high school (or one of the closest, if several serve your area).',
    'You submit only one application, to only one chapter. More than one disqualifies every application.',
  ],

  formatting: [
    'Microsoft Word file (.doc or .docx)',
    '12-point Times New Roman or Arial',
    'Double-spaced, with 1-inch margins on all sides',
    'Your own original work, not published before',
  ],

  aiPolicy:
    'Using AI tools such as ChatGPT, Claude or Grammarly is not allowed. Essays are checked with AI detection software, and essays over the 30% threshold are disqualified.',

  scoring: [
    { item: 'Development of topic / thesis', points: 30 },
    { item: 'Readability', points: 25 },
    { item: 'Progression (logical flow)', points: 20 },
    { item: 'Grammar', points: 15 },
    { item: 'Spelling', points: 5 },
    { item: 'Punctuation', points: 5 },
  ],

  // What a complete application includes (from the packet's submission checklist).
  checklist: [
    'Essay of 700–750 words that directly answers this year’s topic',
    'Essay saved as a Word file: double-spaced, 12-point Times New Roman or Arial, 1-inch margins',
    'Title Page, filled in',
    'Essay Release Form, signed and dated',
    'Media Release & Consent Form, signed and dated',
    'Parent or guardian signatures on both forms if you are under 18',
    'A clear, color head-and-shoulders photo taken within the last six months (business or smart casual)',
  ],
}
