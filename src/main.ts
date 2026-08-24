import { Plugin, TFile, Notice, normalizePath } from "obsidian";
import { DEFAULT_SETTINGS } from "./settings";
import type { AutoFileExtensionSettings } from "./settings";
import { AutoFileExtensionSettingTab } from "./settings";

// Obsidian can return paths with a leading slash or ./ prefix depending on
// context. Strip those before comparison
// change to US spelling of normalise, to not confuse things. Function imported from obsidian uses ize
function normalizedFilePath(path: string): string {
  return normalizePath(path)
    .replace(/^\/+/, "")
    .replace(/^\.\/+/, "");
}

// Get extension from the file path string rather than TFile.extension,
// because other plugins (anything-as-markdown) can spoof TFile.extension
// to "md" for registered custom extensions.
function realExtension(file: TFile): string {
  const dot = file.path.lastIndexOf(".");
  return dot !== -1 ? file.path.slice(dot + 1).toLowerCase() : "";
}

// A file is at the vault root if its path has no folder separator
function isRootPath(file_path: string): boolean {
  const without_leading_dot_slash = file_path.replace(/^\.\/+/, "");
  return (
    without_leading_dot_slash === "" || !without_leading_dot_slash.includes("/")
  );
}

// Interpret directory field entered by user:
// blank, /, . - root only (no subdirs)
// /* or * - entire vault
// dir or dir/ - that folder only (no subdirs)
// dir/* - that folder and all subfolders
// Handles special cases before normalizePath because normalizePath("/*")
// strips leading slash, leaving "*", which would be treated as a dir name
function parseDirectoryMatch(raw: string, file_path: string): boolean {
  const trimmed = (raw ?? "").trim();

  if (trimmed === "" || trimmed === "/" || trimmed === ".") {
    return isRootPath(file_path);
  }
  if (trimmed === "/*" || trimmed === "*") {
    return true;
  }
  const normalized = normalizePath(trimmed).replace(/^\/+/, "");
  const recursive = normalized.endsWith("/*");
  const dir = normalized
    .replace(/\/\*+$/, "")
    .replace(/\/+$/, "")
    .replace(/^\/+/, "");

  if (dir === "") {
    return recursive ? true : isRootPath(file_path);
  }
  const prefix = dir + "/";
  if (recursive) {
    return file_path === dir || file_path.startsWith(prefix);
  }
  // no wildcard, only files in that dir
  return (
    file_path.startsWith(prefix) &&
    !file_path.slice(prefix.length).includes("/")
  );
}
export default class AutoFileExtensionPlugin extends Plugin {
  settings: AutoFileExtensionSettings;

  async onload() {
    await this.loadSettings();
    this.registerEvent(
      this.app.vault.on("modify", (file) => {
        if (file instanceof TFile && this.settings.runOnModify) {
          void this.fixExtension(file);
        }
      }),
    );
    this.addCommand({
      id: "fix-current-file",
      name: "Fix extension for current file",
      callback: () => {
        const file = this.app.workspace.getActiveFile();
        if (file instanceof TFile) {
          void this.fixExtension(file);
        }
      },
    });
    this.addSettingTab(new AutoFileExtensionSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      (await this.loadData()) as Partial<AutoFileExtensionSettings>,
    );
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  // process rules in order, first match applies. Return null if no matches
  async resolveExtension(file: TFile): Promise<string | null> {
    const content = await this.app.vault.read(file);
    const file_path = normalizedFilePath(file.path);
    for (const rule of this.settings.rules) {
      if (!rule.extension) continue;

      if (rule.type === "content") {
        if (!rule.pattern) continue;
        try {
          const regex = new RegExp(rule.pattern, "m");
          if (regex.test(content)) {
            return rule.extension.replace(/^\.+/, "");
          }
        } catch {
          // try to catch bad regex without crashing..
        }
        continue;
      }
      // directory logic (for dir and both options)
      const dir_match = parseDirectoryMatch(rule.directory ?? "", file_path);
      if (!dir_match) continue;

      if (rule.type === "directory") {
        return rule.extension.replace(/^\.+/, "");
      }
      if (rule.type === "both") {
        if (!rule.pattern) continue;
        try {
          const regex = new RegExp(rule.pattern, "m");
          if (regex.test(content)) {
            return rule.extension.replace(/^\.+/, "");
          }
        } catch {
          // try to avoid crashing if regex bad.
        }
      }
    }
    return null;
  }

  currentExtension(file: TFile): string {
    if (this.settings.usePathExtension) {
      return realExtension(file);
    }
    return file.extension.toLowerCase();
  }

  currentBasename(file: TFile): string {
    if (this.settings.usePathExtension) {
      const file_name = file.path.slice(file.path.lastIndexOf("/") + 1);
      const dot = file_name.lastIndexOf(".");
      return dot !== -1 ? file_name.slice(0, dot) : file_name;
    }
    return file.basename;
  }

  async fixExtension(file: TFile) {
    const current_ext = this.currentExtension(file);
    const resolved_ext = await this.resolveExtension(file);
    // if no rule matched and revertToMd is on, change back to .md
    const target_ext = resolved_ext ?? (this.settings.revertToMd ? "md" : null);

    if (this.settings.debugToConsole) {
      console.debug("[AFE]", {
        path: file.path,
        "file.extension": file.extension,
        pathExtension: realExtension(file),
        current_ext,
        resolved_ext,
        target_ext,
        revertToMd: this.settings.revertToMd,
        usePathExtension: this.settings.usePathExtension,
      });
    }

    if (!target_ext) return;
    // just return if it's already the right ext
    if (current_ext === target_ext.toLowerCase()) return;

    const base = this.currentBasename(file);
    const new_name = `${base}.${target_ext}`;
    const base_dir = (file.parent?.path ?? "").replace(/\/+$/, "");
    const new_path = base_dir ? `${base_dir}/${new_name}` : new_name;
    // get before renameFile changes file.path
    const old_name = file.path.slice(file.path.lastIndexOf("/") + 1);
    try {
      await this.app.fileManager.renameFile(file, new_path);
      if (this.settings.showRenameNotifications) {
        new Notice(`Extension changed: ${old_name} > ${new_name}`);
      }
    } catch (err) {
      console.error("[auto-file-extension] Failed to rename file:", err);
    }
  }
}
