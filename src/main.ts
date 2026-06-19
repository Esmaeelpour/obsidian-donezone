import { addIcon, Editor, MarkdownView, moment, Notice, Plugin } from "obsidian";
import { CompletedAreaSettings, DEFAULT_SETTINGS } from "./settings";
import { CompletedAreaSettingTab } from "./settingsTab";

const RIBBON_ICON = `<g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
  <rect stroke="currentColor" stroke-width="8" x="20" y="20" width="60" height="60" rx="10"></rect>
  <path d="M68.7153857,33.5033079 L72.0903697,35.8858648 C72.5415551,36.2043773 72.6491076,36.8283407
    72.3305951,37.2795261 L72.2641586,37.3636708 L48.720426,64.1010398 C46.5305195,66.5880005
    42.7391695,66.8288105 40.2522088,64.638904 C40.1258491,64.5276373 40.0042287,64.4111011
    39.8876706,64.2896051 L28.6056533,52.5296259 C28.258873,52.1681543 28.2330404,51.6058741
    28.5452158,51.2141283 L31.9837559,46.899139 C32.3279438,46.467221 32.9571019,46.3961018
    33.3890199,46.7402897 C33.4274056,46.7708786 33.4634871,46.8042521 33.4969719,46.8401396
    L42.8381754,56.8516325 C43.5917202,57.6592488 44.8572913,57.7030825 45.6649076,56.9495377
    L45.7632746,56.8511374 L67.4072774,33.6382921 C67.7482521,33.2726022 68.3069198,33.2149531
    68.7153857,33.5033079 Z" fill="currentColor" fill-rule="nonzero"></path>
</g>`;

export default class DoneZonePlugin extends Plugin {
	settings: CompletedAreaSettings;
	ribbonIconEl: HTMLElement | null = null;
	statusBarEl: HTMLElement | null = null;

	private isProcessing = false;
	private autoMoveTimer: ReturnType<typeof setTimeout> | null = null;
	private lastCursorLine = -1;

	async onload() {
		await this.loadSettings();
		addIcon("donezone", RIBBON_ICON);
		this.updateRibbonIcon();

		this.addCommand({
			id: "move-completed-items",
			name: "Move completed items to completed area",
			editorCallback: (editor: Editor) => this.moveCompletedItems(editor),
		});

		this.addCommand({
			id: "restore-completed-items",
			name: "Restore all items from completed area",
			editorCallback: (editor: Editor) => this.restoreCompletedItems(editor),
		});

		this.addCommand({
			id: "clear-completed-area",
			name: "Clear completed area",
			editorCallback: (editor: Editor) => this.clearCompletedArea(editor),
		});

		this.addSettingTab(new CompletedAreaSettingTab(this.app, this));
		this.updateStatusBar();
		this.setupAutoMove();
	}

	updateRibbonIcon(): void {
		if (this.settings.showIcon && !this.ribbonIconEl) {
			this.ribbonIconEl = this.addRibbonIcon(
				"donezone",
				"DoneZone: move completed items",
				() => {
					const view =
						this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						this.moveCompletedItems(view.editor);
					} else {
						new Notice("No active markdown file.");
					}
				}
			);
		} else if (!this.settings.showIcon && this.ribbonIconEl) {
			this.ribbonIconEl.remove();
			this.ribbonIconEl = null;
		}
	}

	updateStatusBar(): void {
		if (this.settings.showStatusBar && !this.statusBarEl) {
			this.statusBarEl = this.addStatusBarItem();
			this.statusBarEl.style.cursor = "pointer";
			this.statusBarEl.title = "Toggle DoneZone auto-move";
			this.statusBarEl.addEventListener("click", async () => {
				this.settings.autoMove = !this.settings.autoMove;
				await this.saveSettings();
				this.refreshStatusBar();
			});
			this.refreshStatusBar();
		} else if (!this.settings.showStatusBar && this.statusBarEl) {
			this.statusBarEl.remove();
			this.statusBarEl = null;
		}
	}

	refreshStatusBar(): void {
		if (!this.statusBarEl) return;
		this.statusBarEl.setText(
			this.settings.autoMove ? "DoneZone ✓" : "DoneZone ✗"
		);
	}

	private setupAutoMove(): void {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.lastCursorLine = -1;
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				if (this.isProcessing) return;

				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return;
				const editor = view.editor;
				const currentLine = editor.getCursor().line;

				const lineChanged =
					this.lastCursorLine !== -1 &&
					currentLine !== this.lastCursorLine;
				this.lastCursorLine = currentLine;

				if (this.autoMoveTimer) {
					clearTimeout(this.autoMoveTimer);
					this.autoMoveTimer = null;
				}

				if (lineChanged) {
					this.returnUncheckedItems(editor);
					if (this.settings.autoMove) {
						this.moveCompletedItems(editor, true);
					}
				} else {
					// Fallback for checkbox clicks where cursor doesn't move
					this.autoMoveTimer = setTimeout(() => {
						const v = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (!v || this.isProcessing) return;
						this.returnUncheckedItems(v.editor);
						if (this.settings.autoMove) {
							this.moveCompletedItems(v.editor, true);
						}
					}, 2000);
				}
			})
		);
	}

	private returnUncheckedItems(editor: Editor): void {
		if (this.isProcessing) return;

		const content = editor.getValue();
		const headerRegex = this.getHeaderRegex();
		const match = headerRegex.exec(content);

		if (!match) return;

		const main = content.substring(0, match.index).trimEnd();
		const afterHeader = content
			.substring(match.index + match[0].length)
			.trimStart();

		const uncheckedRegex = /^([ \t]*[-*+] \[ \] .+)\r?\n?/gm;
		const uncheckedItems = [...afterHeader.matchAll(uncheckedRegex)].map(
			(m) => m[1]
		);

		if (uncheckedItems.length === 0) return;

		const cleanedSection = afterHeader.replace(uncheckedRegex, "").trimEnd();
		const returnedItems = uncheckedItems.map((item) =>
			item.replace(/\s*✅.*$/, "")
		);

		const returnedBlock = returnedItems.join("\n");
		const newMain = main ? `${main}\n${returnedBlock}` : returnedBlock;
		const newContent = cleanedSection
			? `${newMain}\n\n${this.getHeaderStr()}\n${cleanedSection}`
			: newMain;

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, newContent);
		this.isProcessing = false;
	}

	private getHeaderStr(): string {
		const level = +this.settings.completedAreaHierarchy;
		return `${"#".repeat(level)} ${this.settings.completedAreaName}`;
	}

	private getHeaderRegex(): RegExp {
		const hashes = escapeRegex(
			"#".repeat(+this.settings.completedAreaHierarchy)
		);
		const name = escapeRegex(this.settings.completedAreaName);
		return new RegExp(`^${hashes}\\s+${name}\\s*$`, "m");
	}

	private splitContent(content: string): {
		main: string;
		completedItems: string[];
	} {
		const headerRegex = this.getHeaderRegex();
		const match = headerRegex.exec(content);

		if (!match) {
			return { main: content, completedItems: [] };
		}

		const main = content.substring(0, match.index).trimEnd();
		const afterHeader = content
			.substring(match.index + match[0].length)
			.trimStart();

		const itemRegex = /^(\s*[-*+] \[[xX]\] .+)$/gm;
		const completedItems = [...afterHeader.matchAll(itemRegex)].map(
			(m) => m[1]
		);

		return { main, completedItems };
	}

	moveCompletedItems(editor: Editor, silent = false): void {
		if (this.isProcessing) return;

		const content = editor.getValue();
		const { main, completedItems: existing } = this.splitContent(content);

		const completedRegex = /^([ \t]*[-*+] \[[xX]\] .+)\r?\n?/gm;
		const newItems = [...main.matchAll(completedRegex)].map((m) => m[1]);

		if (newItems.length === 0) {
			if (!silent) new Notice("No completed items to move.");
			return;
		}

		const suffix = this.settings.dateStamp
			? ` ✅ ${moment().format(this.settings.dateFormat)}`
			: "";

		const stamped = newItems.map((item) => `${item}${suffix}`);
		const allItems =
			this.settings.sortOrder === "prepend"
				? [...stamped, ...existing]
				: [...existing, ...stamped];

		const cleanMain = main
			.replace(completedRegex, "")
			.replace(/\n{3,}/g, "\n\n")
			.trimEnd();

		const completedSection = `${this.getHeaderStr()}\n${allItems.join("\n")}`;
		const newContent = cleanMain
			? `${cleanMain}\n\n${completedSection}`
			: completedSection;

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, newContent);
		this.isProcessing = false;
	}

	restoreCompletedItems(editor: Editor): void {
		const content = editor.getValue();
		const { main, completedItems } = this.splitContent(content);

		if (completedItems.length === 0) {
			new Notice("No completed items to restore.");
			return;
		}

		const restored = completedItems.map((item) =>
			item.replace(/\[[xX]\]/, "[ ]").replace(/\s*✅.*$/, "")
		);

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, `${main}\n${restored.join("\n")}`.trim());
		this.isProcessing = false;

		new Notice(
			`Restored ${completedItems.length} item${
				completedItems.length !== 1 ? "s" : ""
			}.`
		);
	}

	clearCompletedArea(editor: Editor): void {
		const content = editor.getValue();
		const { main, completedItems } = this.splitContent(content);

		if (completedItems.length === 0) {
			new Notice("Completed area is already empty.");
			return;
		}

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, main.trimEnd());
		this.isProcessing = false;

		new Notice(
			`Cleared ${completedItems.length} item${
				completedItems.length !== 1 ? "s" : ""
			}.`
		);
	}

	private setValuePreservingScroll(editor: Editor, content: string): void {
		const cm = (editor as any).cm;
		const scrollTop = cm?.scrollDOM?.scrollTop ?? 0;
		editor.setValue(content);
		this.lastCursorLine = editor.getCursor().line;
		requestAnimationFrame(() => {
			if (cm?.scrollDOM) cm.scrollDOM.scrollTop = scrollTop;
		});
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
