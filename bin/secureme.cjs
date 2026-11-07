#!/usr/bin/env node
'use strict';

const path = require('node:path');
const { run } = require('../lib/installer.cjs');

run(process.argv.slice(2), { packageRoot: path.resolve(__dirname, '..') }).catch((error) => {
  process.stderr.write(`secureme: ${error.message}\n`);
  process.exitCode = 1;
});
