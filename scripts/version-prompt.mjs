/* global process */
import { readFileSync, writeFileSync } from "fs";
import { createInterface } from "readline";
import { execSync } from "child_process";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const manifest = JSON.parse(readFileSync("manifest.json", "utf8"));
console.log(`Current version:       ${manifest.version}`);
console.log(`Min Obsidian version:  ${manifest.minAppVersion}`);

const bump_answer = await ask("Bump version? [patch / minor / major / none]: ");
const bump = bump_answer.trim().toLowerCase();

if (bump === "none" || bump === "") {
	console.log("No version bump.");
	rl.close();
	process.exit(0);
}

if (!["patch", "minor", "major"].includes(bump)) {
	console.error(`Unknown option: ${bump}`);
	rl.close();
	process.exit(1);
}

const min_answer = await ask(`New min required Obsidian version [enter to keep ${manifest.minAppVersion}]: `);
rl.close();

const new_min = min_answer.trim();
if (new_min) {
	manifest.minAppVersion = new_min;
	writeFileSync("manifest.json", JSON.stringify(manifest, null, "\t"));
	console.log(`Minimum Obsidian version updated to ${new_min}`);
}

execSync(`npm version ${bump}`, { stdio: "inherit" });
