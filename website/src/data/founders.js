// The four founders of Omega Psi Phi Fraternity, Inc., shown on /founders.
//
// Sources: Wikipedia (Edgar Amos Love, Oscar James Cooper, Ernest Everett Just) and BlackPast.org
// (Frank Charles Coleman), checked October 2026.
//
// Photos: portraits supplied by the chapter live in public/founders/. To swap one without a code
// change, paste an image link into Supabase > site_content (row founder_<slug>_photo, e.g.
// founder_love_photo); that link takes priority.

export const founding = {
  date: 'November 17, 1911',
  place: 'Howard University, Washington, D.C.',
  summary:
    'On November 17, 1911, three Howard University undergraduates — Edgar Amos Love, Oscar James Cooper and Frank Coleman — met with their biology professor, Ernest Everett Just, in his office and founded Omega Psi Phi Fraternity. Four Cardinal Principles have guided it ever since: Manhood, Scholarship, Perseverance and Uplift.',
  milestones: [
    { date: 'November 17, 1911', text: 'Love, Cooper and Coleman found Omega Psi Phi in Professor Just’s office at Howard University.' },
    { date: 'December 15, 1911', text: 'Alpha Chapter is chartered, after Just helps settle concerns from Howard’s faculty and administration.' },
    { date: '1911–1912', text: 'Love serves as the first Basileus, Cooper as the first Keeper of Records and Coleman as the first Keeper of Seals.' },
  ],
}

export const founders = [
  {
    slug: 'love',
    photo: '/founders/love.webp',
    name: 'Edgar Amos Love',
    title: 'Bishop',
    years: '1891–1974',
    role: 'First Basileus',
    tagline: 'Minister, Army chaplain and bishop of the Methodist Church.',
    bio: [
      'Born in Harrisonburg, Virginia, Edgar Amos Love studied at the academy of Morgan College before entering Howard University, where he earned his bachelor’s degree in 1913 and a Bachelor of Divinity in 1916. He went on to earn a Bachelor of Sacred Theology from Boston University in 1918.',
      'During World War I he served about 14 months in France as a chaplain with the 368th Infantry. He then built a long career in the Methodist ministry across Maryland, Washington, D.C. and West Virginia, and in 1952 was elected a bishop of the Methodist Church, serving the Baltimore area until 1964.',
      'Bishop Love was a voice for justice throughout his life: he served on the Maryland Inter-Racial Commission and led the Methodist Federation for Social Action for ten years.',
    ],
    facts: [
      ['Born', 'September 10, 1891 · Harrisonburg, Virginia'],
      ['Education', 'Howard University (B.A. 1913, B.D. 1916); Boston University (S.T.B. 1918)'],
      ['In Omega', 'First Basileus of Alpha Chapter'],
      ['Service', 'Chaplain, 368th Infantry, World War I'],
      ['Died', 'May 1, 1974 · Baltimore, Maryland'],
    ],
  },
  {
    slug: 'cooper',
    photo: '/founders/cooper.webp',
    name: 'Oscar James Cooper',
    title: 'Dr.',
    years: '1888–1972',
    role: 'First Keeper of Records',
    tagline: 'Physician who served Philadelphia for nearly 50 years.',
    bio: [
      'Born in 1888, Oscar James Cooper earned a bachelor’s degree in biology from Howard University in 1913. As a student he worked as a laboratory assistant to Ernest Everett Just and taught zoology at Howard before earning his Doctor of Medicine there in 1917.',
      'After an internship at Mercy Hospital in Philadelphia, he practiced medicine in the city for close to 50 years from his home and office on West Jefferson Street. He was a founding member of Omega’s Philadelphia chapter and a charter member of the city’s Pyramid Club.',
      'In 2021 the Commonwealth of Pennsylvania unveiled a historical marker at the site of his home and office, and the block was renamed Dr. Oscar J. Cooper Way.',
    ],
    facts: [
      ['Born', '1888'],
      ['Education', 'Howard University (B.S. biology 1913, M.D. 1917)'],
      ['In Omega', 'First Keeper of Records; founding member of the Philadelphia chapter'],
      ['Honors', 'Pennsylvania historical marker (2021); Dr. Oscar J. Cooper Way'],
      ['Died', 'October 9, 1972 · Philadelphia, Pennsylvania'],
    ],
  },
  {
    slug: 'coleman',
    photo: '/founders/coleman.webp',
    name: 'Frank Coleman',
    title: 'Professor',
    years: '1890–1967',
    role: 'First Keeper of Seals',
    tagline: 'Physicist who spent his career teaching at Howard.',
    bio: [
      'Frank Charles Coleman was born in Washington, D.C., graduated from M Street High School in 1908 and entered Howard University in 1909, where he majored in physics and graduated in 1913.',
      'He rose to first lieutenant during World War I, taught at Armstrong Manual Training School, and earned his master’s degree in physics from Howard in 1922. He joined Howard’s physics faculty full time in 1923, received tenure in 1924 and later chaired the department, spending his entire working career at the university.',
      'Coleman was also active in his community as a member of the YMCA Boys Committee, a Freemason and an American Legionnaire.',
    ],
    facts: [
      ['Born', 'July 11, 1890 · Washington, D.C.'],
      ['Education', 'Howard University (B.S. physics 1913, M.S. 1922)'],
      ['In Omega', 'First Keeper of Seals'],
      ['Career', 'Professor and chair, Howard University Department of Physics'],
      ['Died', 'February 24, 1967 · Prince George’s County, Maryland'],
    ],
  },
  {
    slug: 'just',
    photo: '/founders/just.webp',
    name: 'Ernest Everett Just',
    title: 'Dr.',
    years: '1883–1941',
    role: 'Faculty adviser and founder',
    tagline: 'Pioneering biologist and the first Spingarn Medal recipient.',
    bio: [
      'Born in Charleston, South Carolina, Ernest Everett Just graduated from Kimball Union Academy in three years and then from Dartmouth College magna cum laude in 1907, as a member of Phi Beta Kappa. He earned his Ph.D. in zoology from the University of Chicago in 1916.',
      'Just taught at Howard University from 1907 until his death, heading its biology and zoology departments. For about 20 summers he did research at the Marine Biological Laboratory in Woods Hole, and in 1930 he became the first American invited to work at the Kaiser Wilhelm Institute in Berlin. He published at least seventy papers on cell biology and fertilization, and the book The Biology of the Cell Surface (1939).',
      'In 1915 he received the first Spingarn Medal from the NAACP, and in 1996 the U.S. Postal Service honored him with a postage stamp.',
    ],
    facts: [
      ['Born', 'August 14, 1883 · Charleston, South Carolina'],
      ['Education', 'Dartmouth College (A.B. magna cum laude 1907); University of Chicago (Ph.D. 1916)'],
      ['In Omega', 'Faculty adviser; helped secure Alpha Chapter’s charter'],
      ['Honors', 'First Spingarn Medal (1915); U.S. postage stamp (1996)'],
      ['Died', 'October 27, 1941 · Washington, D.C.'],
    ],
  },
]
