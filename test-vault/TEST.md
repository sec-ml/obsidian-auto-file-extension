Script to test renames. Open dev tools with `Cmd/Ctrl` + `Option/Alt` + `I` and paste into console.

First part performs and checks renames

```js
(async () => {
  const afe = app.plugins.plugins['auto-file-extension'];
  if (!afe) return console.error('[AFE] plugin not enabled');

  const extOf  = (p) => { const d = p.lastIndexOf('.'); return d === -1 ? '' : p.slice(d + 1); };
  const baseOf = (p) => { const n = p.slice(p.lastIndexOf('/') + 1); const d = n.lastIndexOf('.'); return d === -1 ? n : n.slice(0, d); };

  const cases = [
    { path: 'content-regex-match.md',                               expect: 'mdx'   },
    { path: 'both-folder/directory-and-content-match.md',           expect: 'svx'   },
    { path: 'specific-folder/specific-directory-match.md',          expect: 'rmd'   },
    { path: 'recursive-folder/nested/recursive-directory-match.md', expect: 'qmd'   },
    { path: 'root-directory-match.md',                              expect: 'mdown' },
    { path: 'unmatched-folder/no-rule-match-reverts.mdx',           expect: 'md'    },
  ];

  const table = {};
  for (const { path: p, expect } of cases) {
    const file = app.vault.getAbstractFileByPath(p);
    if (!file) { console.warn('[AFE] not found:', p); continue; }

    const from = file.path;
    const resolved = await afe.resolveExtension(file);
    const rule = afe.settings.rules.find(r => (r.extension || '').replace(/^\.+/, '') === resolved);
    const ruleInfo = rule
      ? `${rule.type} (${rule.label})`
      : (resolved === null ? (afe.settings.revertToMd ? 'revertToMd' : 'no match') : '?');

    await afe.fixExtension(file);
    const after = extOf(file.path);
    table[baseOf(from)] = {
      before: extOf(from),
      after,
      expected: expect,
      correct: after === expect ? 'Y' : 'N',
      rule: ruleInfo,
    };
  }
  console.table(table);
})();
```

2nd part reverts

```js
(async () => {
  const baseOf = (p) => { const n = p.slice(p.lastIndexOf('/') + 1); const d = n.lastIndexOf('.'); return d === -1 ? n : n.slice(0, d); };

  const originals = [
    'content-regex-match.md',
    'both-folder/directory-and-content-match.md',
    'specific-folder/specific-directory-match.md',
    'recursive-folder/nested/recursive-directory-match.md',
    'root-directory-match.md',
    'unmatched-folder/no-rule-match-reverts.mdx',
  ];

  for (const orig of originals) {
    const slash = orig.lastIndexOf('/');
    const dir = slash === -1 ? '' : orig.slice(0, slash);
    const base = baseOf(orig);
    const file = app.vault.getFiles().find(f =>
      f.basename === base && (dir === '' ? !f.path.includes('/') : f.path.startsWith(dir + '/'))
    );
    if (!file) { console.warn('[AFE] no current file for', orig); continue; }
    if (file.path === orig) { console.log('[AFE] already', orig); continue; }
    const was = file.path;
    await app.fileManager.renameFile(file, orig);
    console.log(`${was}   reverted to   ${orig}`);
  }
  console.log('[AFE] revert complete.');
})();
```
