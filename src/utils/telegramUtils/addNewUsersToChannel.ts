import { spawnSync } from "child_process";
import path from "path"
import {ChannelResponse} from "./createTelegramChannel"

export const addNewUsersToChannel = (channelId: string, channelHash: string, charityAdmins: string, volunteers: string): ChannelResponse => {
  if (charityAdmins === "") {
    charityAdmins = "blank";
  }

  if (volunteers === "") {
    volunteers = "blank"
  }
  
  const dir = path.join(__dirname, "addNewUsersToChannel.py");
  const python = spawnSync(
    "python3",
    ["-u", dir, channelId, channelHash, charityAdmins, volunteers],
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
