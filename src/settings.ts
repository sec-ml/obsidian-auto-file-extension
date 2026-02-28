import { App, PluginSettingTab, Setting } from "obsidian";
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
	silentRename: boolean;
}

export const DEFAULT_SETTINGS: AutoFileExtensionSettings = {
	rules: [],
	revertToMd: false,
	silentRename: false,
};

export class AutoFileExtensionSettingTab extends PluginSettingTab {
	plugin: AutoFileExtensionPlugin;

	constructor(app: App, plugin: AutoFileExtensionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("p", {
			text: "Rules are processed in order. The first matching rule is applied. Use up/down buttons to change order.",
			cls: "setting-item-description",
		});

		new Setting(containerEl)
			.setName("Revert to .md when no rule matches")
			.setDesc(
				"When enabled, files that do not match any rule will be renamed back to .md."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.revertToMd)
					.onChange(async (value) => {
						this.plugin.settings.revertToMd = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Disable rename notifications")
			.setDesc(
				"When enabled, no notification is shown when a file extension is changed."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.silentRename)
					.onChange(async (value) => {
						this.plugin.settings.silentRename = value;
						await this.plugin.saveSettings();
					})
			);

		const rules_container = containerEl.createDiv({ cls: "afe-rules-container" });

		// Renders the full rule list. Called after add, remove, or reorder.
		const renderRules = () => {
			rules_container.empty();
			const rules = this.plugin.settings.rules;

			rules.forEach((rule, index) => {
				const card = rules_container.createDiv({ cls: "afe-rule-card" });

				// Left col: up/down buttons to reorder
				const arrows = card.createDiv({ cls: "afe-rule-arrows" });

				const btn_up = arrows.createEl("button", { cls: "afe-arrow-btn" });
				btn_up.setText("↑");
				btn_up.disabled = index === 0;
				btn_up.addEventListener("click", () => void (async () => {
					if (index <= 0) return;
					const prev = rules[index - 1];
					const curr = rules[index];
					if (prev !== undefined && curr !== undefined) {
						rules[index - 1] = curr;
						rules[index] = prev;
					}
					await this.plugin.saveSettings();
					renderRules();
				})());

				const btn_down = arrows.createEl("button", { cls: "afe-arrow-btn" });
				btn_down.setText("↓");
				btn_down.disabled = index === rules.length - 1;
				btn_down.addEventListener("click", () => void (async () => {
					if (index >= rules.length - 1) return;
					const curr = rules[index];
					const next = rules[index + 1];
					if (curr !== undefined && next !== undefined) {
						rules[index + 1] = curr;
						rules[index] = next;
					}
					await this.plugin.saveSettings();
					renderRules();
				})());

				// Right col: two rows to fit content
				const body = card.createDiv({ cls: "afe-rule-body" });

				// row1 -  rule type, label, extension, remove button
				const row1 = body.createDiv({ cls: "afe-rule-row" });

				const type_label =
					rule.type === "directory"
						? "Directory"
						: rule.type === "content"
							? "Content"
							: "Directory & Content";
				row1.createEl("strong", { text: `Rule: ${type_label}  ` });

				const label_input = row1.createEl("input", { type: "text", cls: "afe-input" });
				label_input.placeholder = "Label";
				// error after loading since adding label. Load blank label if not set
				label_input.value = rule.label ?? "";
				label_input.addEventListener("input", () => void (async () => {
					rule.label = label_input.value;
					await this.plugin.saveSettings();
				})());

				const ext_input = row1.createEl("input", { type: "text", cls: "afe-input afe-input-short" });
				ext_input.placeholder = "Extension";
				ext_input.value = rule.extension;
				ext_input.addEventListener("input", () => void (async () => {
					rule.extension = ext_input.value;
					await this.plugin.saveSettings();
				})());

				const btn_remove = row1.createEl("button", { cls: "afe-remove-btn mod-warning", text: "Remove" });
				btn_remove.addEventListener("click", () => void (async () => {
					rules.splice(index, 1);
					await this.plugin.saveSettings();
					renderRules();
				})());

				// row 2 - directory and/or pattern
				const row2 = body.createDiv({ cls: "afe-rule-row" });

				if (rule.type === "directory" || rule.type === "both") {
					const dir_input = row2.createEl("input", { type: "text", cls: "afe-input" });
					dir_input.placeholder = "Directory (empty=root, dir/, dir/*)";
					dir_input.value = rule.directory;
					dir_input.addEventListener("input", () => void (async () => {
						rule.directory = dir_input.value;
						await this.plugin.saveSettings();
					})());
				}

				if (rule.type === "content" || rule.type === "both") {
					const pattern_input = row2.createEl("input", { type: "text", cls: "afe-input" });
					pattern_input.placeholder = "Regex pattern (e.g. <[A-Z][\\w.]*)";
					pattern_input.value = rule.pattern;
					pattern_input.addEventListener("input", () => void (async () => {
						rule.pattern = pattern_input.value;
						await this.plugin.saveSettings();
					})());
				}
			});
		};

		renderRules();

		new Setting(containerEl)
			.setName("Add rule")
			.addButton((btn) =>
				// eslint-disable-next-line
				btn.setButtonText("+ Directory").onClick(async () => {
					this.plugin.settings.rules.push({
						type: "directory",
						label: "",
						directory: "",
						extension: "",
					});
					await this.plugin.saveSettings();
					renderRules();
				})
			)
			.addButton((btn) =>
				// eslint-disable-next-line
				btn.setButtonText("+ Content").onClick(async () => {
					this.plugin.settings.rules.push({
						type: "content",
						label: "",
						pattern: "",
						extension: "",
					});
					await this.plugin.saveSettings();
					renderRules();
				})
			)
			.addButton((btn) =>
				// eslint-disable-next-line
				btn.setButtonText("+ Directory & Content").onClick(async () => {
					this.plugin.settings.rules.push({
						type: "both",
						directory: "",
						label: "",
						pattern: "",
						extension: "",
					});
					await this.plugin.saveSettings();
					renderRules();
				})
			);
	}
}
