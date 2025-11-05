import nodemailer from 'nodemailer';
import fs from 'fs';
import handlebars from 'handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendEmail({ to, subject, templateName = 'default', templateVars = {}, attachments = [] }) {
  const templatePath = path.join(__dirname, '..', 'emails', `${templateName}.html`);
  let html = `<p>${templateVars.body || 'You have a new notification'}</p>`;

  if (fs.existsSync(templatePath)) {
    const source = fs.readFileSync(templatePath, 'utf8');
    const tpl = handlebars.compile(source);
    html = tpl(templateVars);
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
}
