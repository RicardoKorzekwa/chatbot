import nodemailer from "nodemailer";
import sequelize, { QueryTypes } from "sequelize";
import database from "../../database";
import Setting from "../../models/Setting";
import { config } from 'dotenv';
import { logger } from "../../utils/logger";

config();

// ******* ALTERAR AQUI **********//

//let companyName = "Multiconnect"; // COLOCAR O NOME DO SISTEMA AQUI - ALTERA DE MODO DINÂMICO O NOME DA EMPRESA NO E-MAIL
//let companyPhone = "(00) 0000-0000"; // COLOCAR O TELEFONE DA MENSAGEM DO E-MAIL DA FATURA-
const companyName = process.env.COMPANY_NAME; // Use a variável de ambiente
const companyPhone = process.env.COMPANY_PHONE; // Use a variável de ambiente



// ******* FIM DA ALTERAÇÃO **********//

interface UserData {
  companyId: number;
  id: number;
  email: string;
  // Outras propriedades que você obtém da consulta
}

const generateVerificationCode = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString(); // Gera um código de 4 dígitos
};

const SendMail = async (email: string) => {
  const { hasResult, data } = await filterEmail(email);

  if (!hasResult) {
    return { status: 404, message: "Email não encontrado" };
  }

  const userData = data[0] as UserData;

  if (!userData || userData.companyId === undefined) {
    return { status: 404, message: "Dados do usuário não encontrados" };
  }

  // Gera o código de verificação
  const verificationCode = generateVerificationCode();

  // Atualiza o usuário com o novo código de verificação
  await updateVerificationCode(userData.id, verificationCode);

  const urlSmtp = process.env.MAIL_HOST;
  const userSmtp = process.env.MAIL_USER;
  const passwordSmtp = process.env.MAIL_PASS;
  const fromEmail = process.env.MAIL_FROM;


  const transporter = nodemailer.createTransport({
    host: urlSmtp,
    port: Number(process.env.MAIL_PORT),
    secure: true,
    auth: {
      user: userSmtp,
      pass: passwordSmtp
    }
  });

  try {
    const mailOptions = {
      from: fromEmail,
      to: email,
      subject: `Redefinição de Senha - ${companyName}`,
      text: `Olá,\n\nVocê solicitou a redefinição de senha para sua conta no ${companyName}. Utilize o seguinte Código de Verificação para concluir o processo de redefinição de senha:\n\nCódigo de Verificação: ${verificationCode}\n\nPor favor, copie e cole o Código de Verificação no campo 'Código de Verificação' na plataforma ${companyName}.\n\nSe você não solicitou esta redefinição de senha, por favor, ignore este e-mail.\n\n\nAtenciosamente,\nEquipe ${companyName}`
    };

    const info = await transporter.sendMail(mailOptions);

    return { status: 200, message: "E-mail enviado" };
  } catch (error) {
    logger.error('Erro ao enviar o e-mail:', error);
    return { status: 500, message: "Erro ao enviar o e-mail" };
  }
};

const filterEmail = async (email: string) => {
  const sql = 'SELECT * FROM "Users" WHERE email = :email';
  const result = await database.query<UserData>(sql, {
    replacements: { email },
    type: QueryTypes.SELECT
  });
  return { hasResult: result.length > 0, data: result };
};

const updateVerificationCode = async (userId: number, verificationCode: string) => {
  const sql = 'UPDATE "Users" SET "resetPassword" = :verificationCode WHERE id = :userId';
  await database.query(sql, {
    replacements: { userId, verificationCode },
    type: QueryTypes.UPDATE
  });
};

export { companyName, companyPhone, SendMail };

