import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createTransport } from 'nodemailer';
import { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  async send(message: ContactDto) {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, CONTACT_TO } = process.env;
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !CONTACT_TO) {
      throw new ServiceUnavailableException('Email delivery is not configured. Please contact me by email directly.');
    }

    const transporter = createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASSWORD },
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: CONTACT_TO,
      replyTo: message.email,
      subject: `Portfolio message from ${message.name}`,
      text: `From: ${message.name} <${message.email}>\n\n${message.message}`,
    });
    return { sent: true };
  }
}
