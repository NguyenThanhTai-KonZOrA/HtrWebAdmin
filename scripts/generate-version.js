#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Generate build version
const buildVersion = new Date().getTime().toString();
const buildDate = new Date().toISOString();

// Create version info
const versionInfo = {
  version: buildVersion,
  buildDate: buildDate,
  gitCommit: process.env.GITHUB_SHA || 'development'
};

// Write to public directory
const publicDir = path.join(__dirname, '..', 'public');
const versionFile = path.join(publicDir, 'version.json');

fs.writeFileSync(versionFile, JSON.stringify(versionInfo, null, 2));

// Update index.html with version
const indexFile = path.join(__dirname, '..', 'index.html');
let indexContent = fs.readFileSync(indexFile, 'utf8');

// Replace the version injection
const versionScript = `
  <script>
    // Inject build version
    window.APP_VERSION = '${buildVersion}';
    window.BUILD_DATE = '${buildDate}';
  </script>`;

indexContent = indexContent.replace(
  /<script>\s*\/\/ Inject build version[\s\S]*?<\/script>/,
  versionScript
);

fs.writeFileSync(indexFile, indexContent);

console.log(`✅ Build version ${buildVersion} generated`);
console.log(`📅 Build date: ${buildDate}`);
