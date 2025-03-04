import { spawn } from "./spawn.js";
import { kill } from "./kill.js";
import { send } from "./send.js";
import { deps } from "./deps.js";
import { help } from "./help.js";
import { infect } from "./infect.js";
import { connect } from "./connect.js";

export const commands = {
  spawn,
  kill,
  send,
  deps,
  infect,
  connect,
  help
}; 