import { PDFDocument } from 'pdf-lib'
import nodemailer from 'nodemailer'
export default async function handler(req, res) {
  res.status(200).json({ ok: !!PDFDocument && !!nodemailer })
}
