#!/usr/bin/env bun

import { commands } from './cli/index.js';
import { ensureDependencies } from './dependencies.js';
import { red, error, reset } from './colors.js';

if (!process.env.DEBUG) {
  console.debug = () => {};
}

async function main() {
  try {
    await ensureDependencies({ verbose: false });

    const [command = 'help', ...args] = process.argv.slice(2);
    const cmd = commands[command];

    if (!cmd) {
      console.error(`${error} Unknown command: ${red}${command}${reset}`);
      commands.help.handler(commands);
      process.exit(1);
    }

    if (command === 'help') {
      cmd.handler(commands);
    } else {
      await cmd.handler(args);
    }
  } catch (error) {
    if (error.stderr) console.error(`${error} ${red}${error.stderr.toString()}${reset}`);
    if (error.stdout) console.error(`${error} ${red}${error.stdout.toString()}${reset}`);
    console.error(`${error} ${red}${error.stack || error.message || error}${reset}`);
    process.exit(1);
  }
}

main();
