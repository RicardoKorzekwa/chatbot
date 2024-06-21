import { Request, Response } from "express";
import { SendMail } from "../services/ForgotPassWordServices/SendMail";
import { logger } from "../utils/logger";
import ResetPassword from "../services/ResetPasswordService/ResetPassword";

export const store = async (req: Request, res: Response): Promise<Response> => {
  const { email } = req.params as { email: string };

  if (!email) {
    return res.status(400).json({ message: "Email é obrigatório" });
  }

  try {
    const forgotPassword = await SendMail(email);
    logger.info(`ForgotPass: ${JSON.stringify(forgotPassword)} email: ${email}`);

    if (forgotPassword && forgotPassword.status === 404) {
      return res.status(404).json({ message: "E-mail não enviado devido a erro" });
    }

    return res.status(200).json({ message: "E-mail enviado com sucesso" });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  }
};

export const resetPasswords = async (req: Request, res: Response): Promise<Response> => {
  const { email, token, password } = req.params as { email: string, token: string, password: string };
  const resetPassword = await ResetPassword(email, token.toString(), password);

  if (!email || !token || !password) {
    return res.status(400).json({ message: "Email, código de verificação e senha são obrigatórios" });
  }

  if (!resetPassword || resetPassword.status !== 200) {
    return res.status(404).json({ error: "Verifique o código de verificação informado" });
  }

  return res.status(200).json({ message: "Senha redefinida com sucesso" });
};