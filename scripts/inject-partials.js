#!/usr/bin/env node
/**
 * inject-partials.js — Partial Injection Tool
 *
 * Replaces the content between marker comments in HTML pages with the
 * current content of the matching partial file in _partials/.
 *
 * Marker syntax (in any HTML page):
 *   <!-- PARTIAL:name:start -->
 *   ...old content replaced on every run...
 *   <!-- PARTIAL:name:end -->
 *
 * Partial files: _partials/<name>.html
 *
 * Usage:   node scripts/inject-partials.js
 *
 * The script is idempotent — running it twice produces the same result.
 * CI runs it on every push so partial edits propagate automatically.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PARTIALS_DIR = path.join(ROOT, '_partials');

// All HTML pages to scan for partial markers
const HTML_DIRS = [
  path.join(ROOT, 'services'),
  path.join(ROOT, 'pages'),
  path.join(ROOT, 'areas'),
];
const ROOT_PAGES = [path.join(ROOT, 'index.html')];

function listHtml(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.html'))
    .map(f => path.join(dir, f));
}

const allFiles = [
  ...ROOT_PAGES,
  ...HTML_DIRS.flatMap(listHtml),
];

// Load every partial file
const partials = {};
if (fs.existsSync(PARTIALS_DIR)) {
  for (const file of fs.readdirSync(PARTIALS_DIR)) {
    if (!file.endsWith('.html')) continue;
    const name = path.basename(file, '.html');
    partials[name] = fs.readFileSync(path.join(PARTIALS_DIR, file), 'utf8').trimEnd();
  }
}

function escRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

let changed = 0;

for (const htmlFile of allFiles) {
  if (!fs.existsSync(htmlFile)) continue;
  let content = fs.readFileSync(htmlFile, 'utf8');
  let modified = content;

  for (const [name, body] of Object.entries(partials)) {
    const start = `<!-- PARTIAL:${name}:start -->`;
    const end   = `<!-- PARTIAL:${name}:end -->`;
    const rx = new RegExp(
      `(${escRx(start)})[\\s\\S]*?(${escRx(end)})`,
      'g'
    );
    modified = modified.replace(rx, `$1\n${body}\n  $2`);
  }

  if (modified !== content) {
    fs.writeFileSync(htmlFile, modified, 'utf8');
    console.log(`  ✓ Updated: ${path.relative(ROOT, htmlFile)}`);
    changed++;
  }
}

console.log(`\ninject-partials: ${changed} file(s) updated.`);
