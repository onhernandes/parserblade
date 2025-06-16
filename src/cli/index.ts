#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { parseCommand } from './commands';

const program = new Command();

// Read version from package.json
const packageJson = require('../../package.json');

program
  .name('parserblade')
  .description('The easiest parser for JSON, XML, CSV and YAML')
  .version(packageJson.version, '-v, --version', 'display version number');

// Add commands
program.addCommand(parseCommand);

// Handle errors gracefully
program.configureOutput({
  writeErr: (str: string) => process.stderr.write(chalk.red(str)),
});

// Parse command line arguments
program.parse();
