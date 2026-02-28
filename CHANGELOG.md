# Changelog

## 1.0.4

- Added CHANGELOG.md
- Added release notes extraction from CHANGELOG.md in release workflow
- Changed `release.yml` to pass in tag to the workflow

## 1.0.3

- Fixed lint issues: floating promise in settings event handlers, global process variable in `version-prompt.mjs`

## 1.0.2

- Added GitHub Actions workflows for build/release

## 1.0.1

- Pushed `test-vault`
- Added a couple of dev scripts (version bumping, copy built plugin to `test-vault`)

## 1.0.0

- Initial push
- Trickle-down rule engine to automatically change file extensions
- Rules types: Directory, content (regex), both
- "Revert to .md" when no rule matches
- Reorder rules in plugin config
- Disable notifications
