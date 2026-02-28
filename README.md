# Auto File Extension

Obsidian plugin that automatically changes file extensions based on a trickle-down ruleset. Rules can match by directory path, file content (regex), or both. First matching rule gets applied.

## Warning

Obsidian isn't designed to use non .md files, and for the most part, won't see them. If you're using other MD-like filetypes, you'll need to also ensure that Obsidian can see them (unless you want to rename files and have them disappear from view. Maybe you do?). See: https://github.com/sec-ml/anything-as-md

If you use Sync, you also need to make sure Obsidian is set to process unsupported files.

Lastly, file renaming won't work if a file already exists with the exact same filename. Sounds obvious, but if you're testing with a bunch of `Untitled` files with different extensions, it's something to be aware of.

## Install

1. Copy `main.js`, `manifest.json`, and `styles.css` into your vault at `.obsidian/plugins/auto-file-extension/`.
2. Enable **Auto File Extension** under **Settings → Community plugins**.

## Development

```bash
npm install
npm run dev
```

Then run `npm run test-copy` to copy the built plugin into the test vault. Open the `test-vault` folder in Obsidian.

## Scripts

- `npm run dev` — watch build
- `npm run build` — production build
- `npm run test-copy` — copy plugin into test vault
- `npm run version` — bump version (use with `npm version`)
- `npm run bump` - testing this, do not use
- `npm run lint` — eslint
