// 2026 Omega Ball table reservation & installment agreement (online form at /omega-ball/table).
// The wording below is copied from the chapter's agreement PDF (public/files/2026_Omega_Ball_Table_Agreement.pdf).
// Next year: replace the PDF, update these values, and check the PDF positions in api/_lib/fillOmegaBall.js.

export const omegaBall = {
  year: 2026,
  eventDate: '2026-11-14',
  eventDateText: 'November 14, 2026',
  deadline: '2026-12-15', // final payment deadline (last allowed payment date)
  deadlineText: 'December 15, 2026',
  tableCost: 480,
  deposit: 120,
  seats: 8,
  installments: 4, // Installment 1–4, plus one Additional Payment row
  submitEmail: 'EtaOmicronQues@gmail.com',
  pdf: '/files/2026_Omega_Ball_Table_Agreement.pdf',
  openForm: true, // set false to turn off online submissions
  paymentMethods: [
    ['CashApp', '$HOAlbanyQues'],
    ['Zelle', 'EtaOmicronQues@gmail.com'],
    ['In person', 'Cash, check, or money order'],
  ],
  paymentMemo: 'Omega Ball 2026 – Table Payment',
  terms: [
    ['Eligibility', 'This installment arrangement is available exclusively to financial Brothers of Eta Omicron Graduate Chapter.'],
    ['Reservation Deposit', 'A minimum deposit of $120.00 must be received before a table reservation is considered secured.'],
    ['Financial Responsibility', 'The requesting Brother assumes full responsibility for payment of the entire $480.00 table cost, regardless of individual contributions from guests or other Brothers.'],
    ['Payment Deadline', 'All installment payments must be received by December 15, 2026, unless otherwise authorized in writing by the Omega Ball Committee.'],
    ['Failure to Fulfill Payment Obligations', 'Failure to satisfy the agreed-upon financial obligation may result in the outstanding balance remaining due to the chapter and may affect eligibility for future installment payment arrangements.'],
    ['Communication', 'The requesting Brother agrees to maintain communication with the Omega Ball Committee regarding any anticipated payment difficulties.'],
    ['Financial Obligation Following the Event', 'The requesting Brother acknowledges and agrees that participation in or attendance at the 2026 Omega Ball on November 14, 2026, does not relieve him of his financial obligation under this agreement. Any outstanding balance remaining after the event must still be paid in full no later than December 15, 2026. The requesting Brother remains personally responsible for the entire $480.00 table cost, regardless of whether the event has concluded or whether other individuals have contributed toward the table. All outstanding balances remain due and payable until the financial obligation has been satisfied in full.'],
  ],
  acknowledgment:
    'The requesting Brother expressly acknowledges his responsibility for the full $480.00 table cost, including any unpaid balance remaining after the Omega Ball has taken place, and agrees to satisfy all outstanding payments by December 15, 2026.',
}
