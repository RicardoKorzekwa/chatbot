import sequelize, { QueryTypes, Sequelize } from "sequelize";
import database from "../../database";
import { hash } from "bcryptjs";
import { logger } from "../../utils/logger";

const ResetPassword = async (email: string, verificationCode: string, password: string) => {
  const { hasResult, data } = await filterUser(email, verificationCode);

  if (!hasResult) {
    return { status: 404, message: "Email ou código de verificação não encontrado" };
  }

  try {
    const convertPassword: string = await hash(password, 8);
    const { hasResults, affectedRows } = await updatePassword(email, verificationCode, convertPassword);

    if (!hasResults) {
      return { status: 404, message: "Código de verificação não encontrado" };
    }

    return { status: 200, message: "Senha redefinida com sucesso" };
  } catch (err) {
    logger.error("Erro ao redefinir senha:", err);
    throw err; // Propaga o erro para que seja tratado pelo código que chama ResetPassword
  }
};

const filterUser = async (email: string, verificationCode: string) => {
  const sql = 'SELECT * FROM "Users" WHERE email = :email AND "resetPassword" = :verificationCode';
  const sqll = 'SELECT * FROM "Users" WHERE email = :email';

  try {
    // Consulta para verificar se há um usuário com o código de verificação específico
    const result = await database.query(sql, {
      replacements: { email, verificationCode },
      type: QueryTypes.SELECT
    });

    // Verifica se há resultados na primeira consulta (com verificação de código)
    const hasResult = result.length > 0;

    return { hasResult, data: result };

  } catch (error) {
    logger.error(`Error in filterUser function: ${error.message}`);
    throw error;
  }
};


const updatePassword = async (email: string, verificationCode: string, convertPassword: string) => {
  const sql = 'UPDATE "Users" SET "passwordHash" = :convertPassword, "resetPassword" = \'\' WHERE email = :email AND "resetPassword" = :verificationCode';

  try {
    const result = await database.query(sql, {
      replacements: { email, verificationCode, convertPassword },
      type: QueryTypes.UPDATE
    });

    // Verificar se houve alguma linha afetada pela atualização
    const affectedRows = result[1];
    const hasResults = affectedRows > 0;

    return { hasResults, affectedRows };

  } catch (error) {
    logger.error(`Error in updatePassword function: ${error.message}`);
    throw error;
  }
};


export default ResetPassword;


