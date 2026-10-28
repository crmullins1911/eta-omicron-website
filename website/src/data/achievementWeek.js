// Achievement Week page (/achievement-week), the chapter's week of programs leading up to
// Achievement Week recognition. Everything on the page (and the Home page notice) comes from this file.
//
// TO UPDATE FOR A NEW YEAR: change `year`, `startDate`, `endDate`, `dateText`, then replace `days`.
// Each event's `time` / `endTime` use 24-hour "HH:MM" (e.g. '19:30' for 7:30 PM) so "Add to calendar"
// works; leave `time` empty if it isn't set yet and use `timeNote` for wording like "Immediately after".
// The Home page notice shows from `noticeFrom` until the end of `endDate`, then disappears on its own.

export const achievementWeek = {
  year: 2026,
  startDate: '2026-11-15',
  endDate: '2026-11-21',
  dateText: 'November 15–21, 2026',
  noticeFrom: '2026-10-28',

  intro:
    'Seven days of worship, fellowship, service and uplift. Brothers, family and friends of Eta Omicron are invited to join us for every event of Achievement Week.',

  days: [
    {
      date: '2026-11-15',
      theme: 'Reclamation / Retention',
      events: [
        {
          title: 'Worship with the Ques',
          location: 'First African Baptist Church, Sylvester, GA',
          poc: 'Bro. Zachery Powell',
        },
        {
          title: 'Sunday Football & Fellowship',
          location: 'The Frat House',
          timeNote: 'Immediately after worship',
        },
      ],
    },
    {
      date: '2026-11-16',
      theme: 'Reclamation / Retention',
      events: [
        {
          title: 'Monday Night Football Fellowship',
          description: 'Los Angeles Chargers vs. Baltimore Ravens',
          location: 'Buffalo Wild Wings',
          time: '19:00',
          poc: 'Bro. Kiel Angry, Sr.',
        },
      ],
    },
    {
      date: '2026-11-17',
      theme: 'Reclamation / Retention',
      events: [
        {
          title: 'Candlelight Vigil',
          location: 'Albany State University campus (The Plot)',
          time: '19:30',
          poc: 'Bro. De’Mariyon Bryer',
          note: 'Fellowship to follow; location TBD.',
        },
      ],
    },
    {
      date: '2026-11-18',
      theme: 'Reclamation / Retention',
      events: [
        {
          title: 'Bridge Builders Luncheon',
          description: 'Honoring our Golden Ques.',
          location: 'Golden Corral',
          time: '12:00',
          poc: 'Bro. Dontavious Bonner',
        },
      ],
    },
    {
      date: '2026-11-19',
      theme: 'Medical / Health Initiatives',
      events: [
        {
          title: 'Charles R. Drew Blood Drive',
          location: 'Albany State University West Campus (Old Bookstore)',
          time: '10:00',
          endTime: '15:00',
          poc: 'Bro. Courtland Hughley',
        },
        {
          title: 'Balancing the Equation',
          description: 'A hands-on STEM activity.',
          location: '202 W. Broad Avenue',
          time: '16:00',
          poc: 'Bro. Donald Gilbert',
        },
        {
          title: 'Day of Giving for St. Jude Children’s Research Hospital',
          description: 'A virtual day of giving. Our goal is at least $2,000.',
          location: 'Online',
          poc: 'Bro. Anthony Black',
          link: { href: 'http://fundraising.stjude.org/goto/AlbanyQues', label: 'Give to St. Jude' },
          goal: '$2,000',
        },
      ],
    },
    {
      date: '2026-11-20',
      theme: 'Fatherhood / Mentoring',
      events: [
        {
          title: 'Omega M.E.N. Night Owt',
          description: 'Games, food and a guest speaker.',
          location: 'Merry Acres Middle School',
          poc: 'Bro. Calvin Poole',
        },
      ],
    },
    {
      date: '2026-11-21',
      theme: 'Social Action',
      events: [
        {
          title: 'Project UPLIFT: Feeding the Less Fortunate',
          location: 'Albany Rescue Mission',
          time: '12:00',
          poc: 'Bro. Orientheus Parks',
        },
      ],
    },
  ],
}
