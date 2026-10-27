// Shared by the online application form (src/pages/EssayApply.jsx) and the server function that
// fills in the official PDF and emails it (api/essay-submit.js), so both check the same rules.

export const LIMITS = {
  essayBytes: 1.5 * 1024 * 1024, // a 750-word Word file is usually under 100 KB
  photoBytes: 1.2 * 1024 * 1024, // photos are resized in the browser before sending
  signatureBytes: 200 * 1024,
  text: 200,
  title: 300,
}

/** The submission checklist on page 9 of the official form, in the order printed there. */
export const CHECKLIST = [
  'My essay is 700–750 words.',
  'My essay directly addresses the assigned topic.',
  'My essay is my original work.',
  'My essay is saved as a Word (.doc or .docx) file.',
  'My essay is double-spaced, in 12-point Times New Roman or Arial.',
  'My essay has 1-inch margins.',
  'The Title Page is complete.',
  'The Essay Release Form is signed and dated.',
  'The Media Release & Consent Form is signed and dated.',
  'A parent or guardian has signed the required forms if I am under 18.',
  'A clear, color head-and-shoulders photograph is included.',
  'My photograph was taken within six months of submission, in business or smart casual attire with appropriate background and lighting.',
  'All required documents are included.',
  'I am submitting to only ONE local chapter.',
  'My application is being submitted before the deadline.',
]

export const ESSAY_RELEASE = [
  'I, the undersigned Student, or Parent/Guardian of the student named above, declare that the essay authored and submitted to the Omega Psi Phi Fraternity, Inc., and its unincorporated associations – i.e., local Chapter and/or District – for purposes of consideration in its International High School Essay Contest is an original work that does not exceed a 30 percent AI-generated threshold. I hereby grant to Omega Psi Phi Fraternity, Inc., and its unincorporated associations a non-exclusive right to publish the essay for distribution to members and to the public to advertise or publicize the contest and any winners. Distribution may include and not be limited to print, oral or web-based, Internet distribution.',
  'I further acknowledge that I have been apprised of the Omega Psi Phi Fraternity, Inc., policy relating to use of the essays at the time of my application to the contest. The International High School Essay Contest Application document states: “Persons submitting essays hereby grant to the Omega Psi Phi Fraternity, Inc., and its unincorporated associations – i.e., the local Chapters and the Districts – a non-exclusive right to keep essays and to publish them for the purpose of advertising and publicizing the International High School Essay Contest to members and the general public.”',
  'I hereby grant the Omega Psi Phi Fraternity, Inc., and its unincorporated associations an irrevocable, worldwide license to use, reproduce, distribute, or modify the essay in its entirety or portions thereof. I also declare that if any parts of my child’s submission are copyrighted, permission has been sought and received by me/us, or appropriate attribution has been made. I further agree that the name, likeness, and biographical material, including affiliations of the author, may be used in connection with, and promotion of, the essay and/or the International High School Essay Contest itself.',
]

export const MEDIA_RELEASE = [
  'I hereby grant to Omega Psi Phi Fraternity, Inc., and its unincorporated associations – i.e., local Chapter and/or District – permission to use my likeness in photographs, video recordings or electronic images in any and all of its publications, including website entries, without payment or any other consideration. I understand and agree that these materials will become the property of the Organization and will not be returned. I hereby irrevocably authorize the Organization to edit, alter, copy, exhibit, publish or distribute these images for purposes of publicizing the organization’s programs or for any other lawful purpose. In addition, I waive the right to inspect or approve the finished product, including written or electronic copy, wherein my likeness appears.',
  'Additionally, I waive any right to royalties or other compensation arising or related to the use of my image. I hereby hold harmless and release and forever discharge the Organization from all claims, demands, and causes of action which I, my heirs, representatives, executors, administrators, or any other persons acting on my behalf or on behalf of my estate have or may have by reason of this authorization.',
  'I am 18 years of age and am competent to contract in my own name, or if I am under age 18, a parent or guardian has signed below. I have read this release before signing below and I fully understand the contents, meaning and impact of this release.',
  'Parent or guardian of a student under 18: I hereby certify that I am the parent or guardian of the student named above who is under the age of 18 years at this time, and I do hereby give my consent without reservation to the foregoing release on behalf of the student named.',
]

export const isMinor = (age) => Number(age) < 18

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const filled = (v) => typeof v === 'string' && v.trim().length > 0

/** Returns { field: message } for everything missing or wrong; empty object = ready to send. */
export function validateApplication(a) {
  const e = {}
  const s = a?.student || {}
  const h = a?.school || {}
  const p = a?.parent || {}
  const need = (key, value, label) => {
    if (!filled(value)) e[key] = `${label} is required.`
    else if (value.length > LIMITS.text) e[key] = `${label} is too long.`
  }

  need('student.first', s.first, 'First name')
  need('student.last', s.last, 'Last name')
  need('student.email', s.email, 'Email')
  if (filled(s.email) && !EMAIL.test(s.email.trim())) e['student.email'] = 'Enter a valid email address.'
  const age = Number(s.age)
  if (!filled(String(s.age ?? ''))) e['student.age'] = 'Age is required.'
  else if (!Number.isInteger(age) || age < 13 || age > 25) e['student.age'] = 'Enter your age in years.'
  if (!filled(s.cellPhone) && !filled(s.homePhone)) e['student.cellPhone'] = 'Enter at least one phone number.'
  need('student.street', s.street, 'Street address')
  need('student.city', s.city, 'City')
  need('student.state', s.state, 'State')
  need('student.zip', s.zip, 'ZIP code')

  need('school.name', h.name, 'High school name')
  need('school.street', h.street, 'School street address')
  need('school.city', h.city, 'School city')
  need('school.state', h.state, 'School state')
  need('school.zip', h.zip, 'School ZIP code')

  const minor = isMinor(s.age)
  if (minor) {
    need('parent.name', p.name, 'Parent or guardian name')
    need('parent.email', p.email, 'Parent or guardian email')
    if (filled(p.email) && !EMAIL.test(p.email.trim())) e['parent.email'] = 'Enter a valid email address.'
    if (!filled(p.cellPhone) && !filled(p.homePhone)) e['parent.cellPhone'] = 'Enter at least one phone number.'
  } else if (filled(p.email) && !EMAIL.test(p.email.trim())) {
    e['parent.email'] = 'Enter a valid email address.'
  }

  if (!filled(a?.essay?.title)) e['essay.title'] = 'Essay title is required.'
  else if (a.essay.title.length > LIMITS.title) e['essay.title'] = 'Essay title is too long.'
  if (!a?.essay?.file?.data) e['essay.file'] = 'Attach your essay as a Word file.'
  if (!a?.photo?.data) e['photo'] = 'Attach your photo.'

  if (!a?.consents?.eligibility) e['consents.eligibility'] = 'Confirm that you are eligible.'
  if (!a?.consents?.essayRelease) e['consents.essayRelease'] = 'Agree to the Essay Release Form.'
  if (!a?.consents?.mediaRelease) e['consents.mediaRelease'] = 'Agree to the Media Release & Consent Form.'
  const ticks = a?.consents?.checklist || []
  if (CHECKLIST.some((_, i) => !ticks[i])) e['consents.checklist'] = 'Tick every item on the checklist.'

  need('signatures.student.typed', a?.signatures?.student?.typed, 'Your signature (typed full name)')
  if (minor) need('signatures.parent.typed', a?.signatures?.parent?.typed, 'Parent or guardian signature (typed full name)')

  return e
}

/** Today's date as the form prints it, in the chapter's time zone. */
export function signingDate(date = new Date()) {
  return date.toLocaleDateString('en-US', { timeZone: 'America/New_York', month: '2-digit', day: '2-digit', year: 'numeric' })
}
