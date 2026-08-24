# Changelog

## 1.0.6 - 2026-08-24

- Migrated settings to [declarative API](https://docs.obsidian.md/plugins/guides/migrate-declarative-settings)
- Fixed two setting descriptions rendering as `[object DocumentFragment]`
- Bumped minimum Obsidian version to 1.13.0 (for declarative settings API)
- Bumped `eslint-plugin-obsidianmd` to `^0.4.2`
- Added artefact attestations (for [plugin page](https://community.obsidian.md/plugins/auto-file-extension) Scorecard)
- Added `prettier` (with `.prettierrc` and `.prettierignore`)
- Added rule ordering test script to `test-vault`

## 1.0.5 - 2026-06-03

- Added 'Run automatically on file modification/save' option (off by default)
- Added a manual command, 'Fix extension for current file', to run on the active file (lets you trigger at a chosen point, e.g. when chaining through Linter/Templater)
- Added 'Get extension from file path' option to read the extension from the on-disk path instead of `TFile.extension`, for when another plugin spoofs it to `md` (e.g. Anything as Markdown)
- Added 'Debug to console' option
- Changed 'Disable rename notifications' to 'Enable rename notifications' (now off by default)
- Fixed rename notification showing the new name on both sides
- Renamed internal `handleFileSave` to `fixExtension`, and reused `loadSettings()` in `onload` instead of duplicating the load logic
- Updated ESLint & setup. Renamed config to `eslint.config.js`, bumped `eslint-plugin-obsidianmd` to `^0.3.0` and `typescript-eslint` to `^8.59.4`, added `eslint`
- Fixed lint issues following bump. Use `activeDocument` instead of `document`, `console.debug` for the debug log, and reworded a regex placeholder
- Updated README ('How it works' and 'Using with other plugins' sections)
- test-vault: Updated bundled Anything as Markdown to 1.1.2 (needed for testing) and fixed the rule config in test-vault. Also added in JS to run tests in dev-tools console
- Replaced 'sensible test vault' with a more sensible test vault

## 1.0.4 - 2026-02-28

- Added CHANGELOG.md
- Added release notes extraction from CHANGELOG.md in release workflow
- Changed `release.yml` to pass in tag to the workflow

## 1.0.3 - *(no release)*

- Fixed lint issues: floating promise in settings event handlers, global process variable in `version-prompt.mjs`

## 1.0.2 - *(no release)*

- Added GitHub Actions workflows for build/release

## 1.0.1 - *(no release)*

- Pushed `test-vault`
- Added a couple of dev scripts (version bumping, copy built plugin to `test-vault`)

## 1.0.0 - *(no release)*

- Initial push
- Trickle-down rule engine to automatically change file extensions
- Rules types: Directory, content (regex), both
- "Revert to .md" when no rule matches
- Reorder rules in plugin config
- Disable notifications
