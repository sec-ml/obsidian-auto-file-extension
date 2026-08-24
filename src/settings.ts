import {
  App,
  PluginSettingTab,
  type SettingDefinitionItem,
  type SettingGroupItem,
} from "obsidian";
import type AutoFileExtensionPlugin from "./main";

// directory only rule
export interface DirectoryRule {
  type: "directory";
  label: string;
  directory: string;
  extension: string;
}

// content only rule (regex)
export interface ContentRule {
  type: "content";
  label: string;
  pattern: string;
  extension: string;
}

// directory and content (regex)rule
export interface BothRule {
  type: "both";
  directory: string;
  label: string;
  pattern: string;
  extension: string;
}

export type Rule = DirectoryRule | ContentRule | BothRule;

export interface AutoFileExtensionSettings {
  rules: Rule[];
  revertToMd: boolean;
  showRenameNotifications: boolean;
  runOnModify: boolean;
  usePathExtension: boolean;
  debugToConsole: boolean;
}

export const DEFAULT_SETTINGS: AutoFileExtensionSettings = {
  rules: [],
  revertToMd: false,
  showRenameNotifications: false,
  runOnModify: false,
  usePathExtension: false,
  debugToConsole: false,
};

export class AutoFileExtensionSettingTab extends PluginSettingTab {
  plugin: AutoFileExtensionPlugin;

  constructor(app: App, plugin: AutoFileExtensionPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  // https://docs.obsidian.md/plugins/guides/migrate-declarative-settings
  getSettingDefinitions(): SettingDefinitionItem[] {
    // createFragment() instead of activeDocument.createDocumentFragment()
    // then append createEl() instead of activeDocument.createElement()
    const runOnModifyDesc = createFragment();
    runOnModifyDesc.append(
      "Rules are evaluated on every file modification/save.",
    );
    runOnModifyDesc.append(createEl("br"));
    runOnModifyDesc.append(createEl("br"));
    const runOnModifyHint = createEl("strong");
    runOnModifyHint.append(
      'Run manually from command palette with "',
      "Fix extension for current file",
      '"',
    );
    runOnModifyDesc.append(runOnModifyHint);

    const pathExtDesc = createFragment();
    pathExtDesc.append(
      "The current file's extension is read from the on-disk file path. Enable this if another plugin is interfering with Obsidian's TFile.extension property (e.g. ",
    );
    const aamLink = createEl("a");
    aamLink.href = "obsidian://show-plugin?id=anything-as-md";
    aamLink.textContent = "Anything as Markdown";
    pathExtDesc.append(aamLink, ").");

    return [
      {
        name: "",
        render: (setting) => {
          setting.settingEl.empty();
          setting.settingEl.createEl("p", {
            text: "Rules are processed in order. The first matching rule is applied. Use up/down buttons to change order.",
            cls: "setting-item-description",
          });
        },
      },
      {
        name: "Run automatically on file modification/save",
        desc: runOnModifyDesc,
        control: { type: "toggle", key: "runOnModify" },
      },
      {
        name: "Get extension from file path",
        desc: pathExtDesc,
        control: { type: "toggle", key: "usePathExtension" },
      },
      {
        name: "Revert to .md when no rule matches",
        desc: "Files that do not match any rule are renamed back to .md.",
        control: { type: "toggle", key: "revertToMd" },
      },
      {
        name: "Enable rename notifications",
        desc: "A notification is shown when a file extension is changed.",
        control: { type: "toggle", key: "showRenameNotifications" },
      },
      {
        name: "Debug to console",
        desc: "Log file processing details to the console.",
        control: { type: "toggle", key: "debugToConsole" },
      },
      {
        type: "list",
        heading: "Rules",
        items: this.plugin.settings.rules.map(
          (rule, index): SettingGroupItem => ({
            name: "",
            render: (setting) => {
              const rules = this.plugin.settings.rules;

              setting.settingEl.empty();
              setting.settingEl.addClass("afe-rule-card");

              // Left col: up/down buttons to reorder
              const arrows = setting.settingEl.createDiv({
                cls: "afe-rule-arrows",
              });

              const btn_up = arrows.createEl("button", {
                cls: "afe-arrow-btn",
              });
              btn_up.setText("↑");
              btn_up.disabled = index === 0;
              btn_up.addEventListener(
                "click",
                () =>
                  void (async () => {
                    if (index <= 0) return;
                    const prev = rules[index - 1];
                    const curr = rules[index];
                    if (prev !== undefined && curr !== undefined) {
                      rules[index - 1] = curr;
                      rules[index] = prev;
                    }
                    await this.plugin.saveSettings();
                    this.update();
                  })(),
              );

              const btn_down = arrows.createEl("button", {
                cls: "afe-arrow-btn",
              });
              btn_down.setText("↓");
              btn_down.disabled = index === rules.length - 1;
              btn_down.addEventListener(
                "click",
                () =>
                  void (async () => {
                    if (index >= rules.length - 1) return;
                    const curr = rules[index];
                    const next = rules[index + 1];
                    if (curr !== undefined && next !== undefined) {
                      rules[index + 1] = curr;
                      rules[index] = next;
                    }
                    await this.plugin.saveSettings();
                    this.update();
                  })(),
              );

              const body = setting.settingEl.createDiv({
                cls: "afe-rule-body",
              });

              // row1 - rule type, label, extension, remove button
              const row1 = body.createDiv({ cls: "afe-rule-row" });

              const type_label =
                rule.type === "directory"
                  ? "Directory"
                  : rule.type === "content"
                    ? "Content"
                    : "Directory & Content";
              row1.createEl("strong", { text: `Rule: ${type_label}  ` });

              const label_input = row1.createEl("input", {
                type: "text",
                cls: "afe-input",
              });
              label_input.placeholder = "Label";
              // error after loading since adding label. Load blank label if not set
              label_input.value = rule.label ?? "";
              label_input.addEventListener(
                "input",
                () =>
                  void (async () => {
                    rule.label = label_input.value;
                    await this.plugin.saveSettings();
                  })(),
              );

              const ext_input = row1.createEl("input", {
                type: "text",
                cls: "afe-input afe-input-short",
              });
              ext_input.placeholder = "Extension";
              ext_input.value = rule.extension;
              ext_input.addEventListener(
                "input",
                () =>
                  void (async () => {
                    rule.extension = ext_input.value;
                    await this.plugin.saveSettings();
                  })(),
              );

              // row 2 - directory and/or pattern
              const row2 = body.createDiv({ cls: "afe-rule-row" });

              if (rule.type === "directory" || rule.type === "both") {
                const dir_input = row2.createEl("input", {
                  type: "text",
                  cls: "afe-input",
                });
                dir_input.placeholder = "Directory (empty=root, dir/, dir/*)";
                dir_input.value = rule.directory;
                dir_input.addEventListener(
                  "input",
                  () =>
                    void (async () => {
                      rule.directory = dir_input.value;
                      await this.plugin.saveSettings();
                    })(),
                );
              }

              if (rule.type === "content" || rule.type === "both") {
                const pattern_input = row2.createEl("input", {
                  type: "text",
                  cls: "afe-input",
                });
                pattern_input.placeholder = "Regex pattern (e.g. ^draft)";
                pattern_input.value = rule.pattern;
                pattern_input.addEventListener(
                  "input",
                  () =>
                    void (async () => {
                      rule.pattern = pattern_input.value;
                      await this.plugin.saveSettings();
                    })(),
                );
              }
            },
          }),
        ),
      },
      {
        name: "Add rule",
        render: (setting) => {
          setting
            .addButton((btn) =>
              btn.setButtonText("+ directory").onClick(
                () =>
                  void (async () => {
                    this.plugin.settings.rules.push({
                      type: "directory",
                      label: "",
                      directory: "",
                      extension: "",
                    });
                    await this.plugin.saveSettings();
                    this.update();
                  })(),
              ),
            )
            .addButton((btn) =>
              btn.setButtonText("+ content").onClick(
                () =>
                  void (async () => {
                    this.plugin.settings.rules.push({
                      type: "content",
                      label: "",
                      pattern: "",
                      extension: "",
                    });
                    await this.plugin.saveSettings();
                    this.update();
                  })(),
              ),
            )
            .addButton((btn) =>
              btn.setButtonText("+ directory & content").onClick(
                () =>
                  void (async () => {
                    this.plugin.settings.rules.push({
                      type: "both",
                      directory: "",
                      label: "",
                      pattern: "",
                      extension: "",
                    });
                    await this.plugin.saveSettings();
                    this.update();
                  })(),
              ),
            );
        },
      },
    ];
  }
}
