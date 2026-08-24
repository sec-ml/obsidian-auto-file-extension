#!/usr/bin/env node
/**
 * Copy plugin files needed to run in test vault.
 * Call with `npm run test-copy` after build.
 */

import { copyFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PLUGIN_ID = "auto-file-extension";
const DEST = join(ROOT, "test-vault", ".obsidian", "plugins", PLUGIN_ID);

const files = ["main.js", "manifest.json", "styles.css"];

async function copyToTestVault() {
  await mkdir(DEST, { recursive: true });
  for (const file of files) {
    await copyFile(join(ROOT, file), join(DEST, file));
  }
}

copyToTestVault();
