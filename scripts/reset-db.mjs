#!/usr/bin/env node
// Deletes the SQLite database (and WAL sidecars). The app reseeds on the next request.
import fs from 'node:fs';
import path from 'node:path';

const target = process.env.DATABASE_PATH
  ? path.resolve(process.cwd(), process.env.DATABASE_PATH)
  : path.join(process.cwd(), 'data', 'store.db');

const files = [target, `${target}-wal`, `${target}-shm`];
let removed = 0;

for (const file of files) {
  if (fs.existsSync(file)) {
    fs.rmSync(file);
    removed += 1;
    console.log(`removed ${path.relative(process.cwd(), file)}`);
  }
}

if (removed === 0) console.log('nothing to remove — the database does not exist yet');
console.log('the store reseeds automatically on the next request');
