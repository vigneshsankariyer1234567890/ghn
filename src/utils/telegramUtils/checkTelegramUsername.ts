import { spawnSync } from "child_process";
import { FieldError } from "../../resolvers/user";
import path from "path"

export class TeleOutput {
    success: boolean
    errors: FieldError[]
    timeout: number
}

export const checkTelegramUsername = (username: string): TeleOutput => {
  const dir = path.join(__dirname, "checkUsername.py");
  const python = spawnSync(
    "python3",
    ["-u", dir, username],
    { encoding: "utf-8", shell: true, serialization: 'json' }
  );

  try {
    const r = JSON.parse(python.output[1]);
    return {
      success: r.success,
      errors: r.success ? [] : [{field: r.errors[0].field, message: r.errors[0].message}],
      timeout: r.timeout
    }
  } catch (err) {
    return {
      success: false,
      errors: [{field: err.name, message: err.message + " the input was " + python.output.toString()}],
      timeout: 0
    }
  }
};
