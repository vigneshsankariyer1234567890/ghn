import { spawnSync } from "child_process";
import { FieldError } from "../../resolvers/user";
import path from "path"

export class ChannelResponse {
    success: boolean
    errors: FieldError[]
    timeout: number
    apiId?: number
    apiHash?: number
}

export const createTelegramChannel = (eventName: string, eventDescription: string, charityAdmins: string, volunteers: string): ChannelResponse => {
  const dir = path.join(__dirname, "createTelegramChannel.py");
  const python = spawnSync(
    "python3",
    ["-u", dir, eventName, eventDescription, charityAdmins, volunteers],
    { encoding: "utf-8", shell: true, serialization: 'json' }
  );

  try {
    const r = JSON.parse(python.output[1]);
    return {
      success: r.success,
      errors: r.success ? [] : [{field: r.errors[0].field, message: r.errors[0].message}],
      timeout: r.timeout,
      apiId: r.api_id,
      apiHash: r.api_access_hash
    }
  } catch (err) {
    return {
      success: false,
      errors: [{field: err.name, message: err.message + " the input was " + python.output.toString()}],
      timeout: 0
    }
  }
};
