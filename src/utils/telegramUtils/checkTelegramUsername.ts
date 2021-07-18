import { spawnSync } from "child_process";
import { FieldError } from "../../resolvers/user";

export class TeleOutput {
    success: boolean
    errors: FieldError[]
    timeout: number
}

export const checkTelegramUsername = (username: string): TeleOutput => {
  const python = spawnSync(
    "python3",
    ["src/utils/telegramUtils/checkUsername.py", username],
    { encoding: "utf-8" }
  );

  const r = JSON.parse(python.output[1].slice(0, -1));

  return {
      success: r.success,
      errors: r.success ? [] : [{field: r.errors[0].field, message: r.errors[0].message}],
      timeout: r.timeout
  }
};
