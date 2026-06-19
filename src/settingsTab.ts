import { App, moment, PluginSettingTab, Setting } from "obsidian";
import type DoneZonePlugin from "./main";

export class CompletedAreaSettingTab extends PluginSettingTab {
	plugin: DoneZonePlugin;

	constructor(app: App, plugin: DoneZonePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Header level")
			.setDesc("Heading level for the completed area (H1–H6).")
			.addDropdown((drop) =>
				drop
					.addOptions({
						"1": "H1",
						"2": "H2",
						"3": "H3",
						"4": "H4",
						"5": "H5",
						"6": "H6",
					})
					.setValue(this.plugin.settings.completedAreaHierarchy)
					.onChange(async (value) => {
						this.plugin.settings.completedAreaHierarchy = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Header name")
			.setDesc("Text of the completed area heading.")
			.addText((text) =>
				text
					.setPlaceholder("Completed")
					.setValue(this.plugin.settings.completedAreaName)
					.onChange(async (value) => {
						this.plugin.settings.completedAreaName = value || "Completed";
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Show ribbon icon")
			.setDesc("Show the move-completed icon in the left sidebar.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showIcon)
					.onChange(async (value) => {
						this.plugin.settings.showIcon = value;
						await this.plugin.saveSettings();
						this.plugin.updateRibbonIcon();
					})
			);

		new Setting(containerEl)
			.setName("Show status bar toggle")
			.setDesc(
				"Show a button in the bottom status bar that toggles auto-move on/off and displays its current state."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (value) => {
						this.plugin.settings.showStatusBar = value;
						await this.plugin.saveSettings();
						this.plugin.updateStatusBar();
					})
			);

		new Setting(containerEl)
			.setName("Auto-move on complete")
			.setDesc(
				"Automatically move items to the completed area when a checkbox is checked."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autoMove)
					.onChange(async (value) => {
						this.plugin.settings.autoMove = value;
						await this.plugin.saveSettings();
						this.plugin.refreshStatusBar();
					})
			);

		new Setting(containerEl)
			.setName("Show delete button")
			.setDesc(
				"Show a × on the right of each checkbox line in the editor; click it to delete that task."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.showDeleteButton)
					.onChange(async (value) => {
						this.plugin.settings.showDeleteButton = value;
						await this.plugin.saveSettings();
						this.app.workspace.updateOptions();
					})
			);

		new Setting(containerEl)
			.setName("Task autocomplete")
			.setDesc(
				"While typing in a checkbox, suggest matching tasks from elsewhere in the note. Selecting one moves that task to the line you are typing."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.autocomplete)
					.onChange(async (value) => {
						this.plugin.settings.autocomplete = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Date stamp")
			.setDesc("Append a completion date when items are moved.")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.dateStamp)
					.onChange(async (value) => {
						this.plugin.settings.dateStamp = value;
						await this.plugin.saveSettings();
						this.display();
					})
			);

		if (this.plugin.settings.dateStamp) {
			new Setting(containerEl)
				.setName("Date format")
				.setDesc(
					`Moment.js format string. Preview: ${moment().format(
						this.plugin.settings.dateFormat
					)}`
				)
				.addText((text) =>
					text
						.setPlaceholder("YYYY-MM-DD")
						.setValue(this.plugin.settings.dateFormat)
						.onChange(async (value) => {
							this.plugin.settings.dateFormat = value || "YYYY-MM-DD";
							await this.plugin.saveSettings();
						})
				);
		}

		new Setting(containerEl)
			.setName("New items order")
			.setDesc("Where to place newly moved items within the completed area.")
			.addDropdown((drop) =>
				drop
					.addOptions({
						append: "Append (bottom)",
						prepend: "Prepend (top)",
					})
					.setValue(this.plugin.settings.sortOrder)
					.onChange(async (value: "append" | "prepend") => {
						this.plugin.settings.sortOrder = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
