import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendRecoveryEmail(email: string, recoveryLink: string): Promise<void> {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recuperação de Senha',
      text: `Para redefinir sua senha, clique no seguinte link: ${recoveryLink}`,
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error('Erro ao enviar e-mail');
    }
  }
}
