#!/usr/bin/env bun

import { runValidateCli } from '../src/examples/cli';

await runValidateCli(process.cwd(), process.argv.slice(2));
