import {
	addIcon,
	Editor,
	EditorPosition,
	EditorSuggest,
	EditorSuggestContext,
	EditorSuggestTriggerInfo,
	MarkdownView,
	moment,
	Notice,
	Plugin,
} from "obsidian";
import { RangeSetBuilder } from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	ViewPlugin,
	ViewUpdate,
	WidgetType,
} from "@codemirror/view";
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

export default class CheckSortedPlugin extends Plugin {
	settings: CompletedAreaSettings;
	ribbonIconEl: HTMLElement | null = null;
	statusBarEl: HTMLElement | null = null;

	private isProcessing = false;
	private lastCursorLine = -1;
	private lastCheckboxSnapshot = '';

	async onload() {
		await this.loadSettings();
		addIcon("checksorted", RIBBON_ICON);
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
		this.registerEditorSuggest(new CheckboxSuggest(this));
		this.registerEditorExtension(deleteButtonExtension(this));
		this.updateStatusBar();
		this.setupAutoMove();
	}

	updateRibbonIcon(): void {
		if (this.settings.showIcon && !this.ribbonIconEl) {
			this.ribbonIconEl = this.addRibbonIcon(
				"checksorted",
				"CheckSorted: move completed items",
				() => {
					const view =
						this.app.workspace.getActiveViewOfType(MarkdownView);
					if (view) {
						// Full sync: return unchecked items out of the completed
						// area, then move newly completed items into it.
						this.returnUncheckedItems(view.editor, true);
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
			this.statusBarEl.addClass("checksorted-status-bar");
			this.statusBarEl.setAttribute("aria-label", "Toggle CheckSorted auto-move");
			this.registerDomEvent(this.statusBarEl, "click", async () => {
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
			this.settings.autoMove ? "CheckSorted ✓" : "CheckSorted ✗"
		);
	}

	private setupAutoMove(): void {
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", () => {
				this.lastCursorLine = -1;
				this.lastCheckboxSnapshot = '';
			})
		);

		this.registerEvent(
			this.app.workspace.on("editor-change", () => {
				if (this.isProcessing) return;

				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (!view) return;
				const editor = view.editor;
				const currentLine = editor.getCursor().line;
				const content = editor.getValue();

				const prevCursorLine = this.lastCursorLine;
				const lineChanged = prevCursorLine !== -1 && currentLine !== prevCursorLine;
				this.lastCursorLine = currentLine;

				const snapshot = this.getCheckboxSnapshot(content);
				const checkboxChanged = snapshot !== this.lastCheckboxSnapshot;
				this.lastCheckboxSnapshot = snapshot;

				// Detect cursor leaving the completed section for the main section
				const headerMatch = this.getHeaderRegex().exec(content);
				const headerLine = headerMatch
					? content.substring(0, headerMatch.index).split('\n').length - 1
					: -1;
				const exitedCompleted =
					lineChanged &&
					headerLine >= 0 &&
					prevCursorLine > headerLine &&
					currentLine <= headerLine;

				if (!this.settings.autoMove) return;

				// returnUncheckedItems fires on explicit checkbox toggle or on exit from completed.
				// It does NOT fire on lineChanged within the completed section, avoiding cursor chaos
				// when the user presses Enter or navigates inside that section.
				if (exitedCompleted || checkboxChanged) {
					this.returnUncheckedItems(editor, exitedCompleted);
				}
				if (lineChanged || checkboxChanged) {
					this.moveCompletedItems(editor, true);
				}
			})
		);
	}

	private getCheckboxSnapshot(content: string): string {
		return (content.match(/^[ \t]*[-*+] \[[xX ]\]/gm) ?? []).join('');
	}

	// cleanEmpty=true: also discard empty "- [ ] " continuation lines (called on exit from completed).
	// cleanEmpty=false: only return items with real content (called on checkbox toggle).
	private returnUncheckedItems(editor: Editor, cleanEmpty = false): void {
		if (this.isProcessing) return;

		const content = editor.getValue();
		const headerRegex = this.getHeaderRegex();
		const match = headerRegex.exec(content);

		if (!match) return;

		const main = content.substring(0, match.index).trimEnd();
		const rawAfterHeader = content.substring(match.index + match[0].length);
		const afterHeader = rawAfterHeader.trimStart();

		// With cleanEmpty, .* also catches empty "- [ ] " continuation lines.
		const uncheckedRegex = cleanEmpty
			? /^([ \t]*[-*+] \[ \] .*)\r?\n?/gm
			: /^([ \t]*[-*+] \[ \] .+)\r?\n?/gm;
		const uncheckedMatches = [...afterHeader.matchAll(uncheckedRegex)];

		if (uncheckedMatches.length === 0) return;

		// Also strip any empty "- [ ] " continuation lines that Obsidian inserts when
		// Enter is pressed on an unchecked item. Otherwise a stray empty checkbox is left
		// behind in the completed section and renders with a bullet (● ☐).
		const cleanedSection = afterHeader
			.replace(uncheckedRegex, "")
			.replace(/^[ \t]*[-*+] \[ \][ \t]*(\r?\n|$)/gm, "")
			.trimEnd();

		const hasContent = /^[ \t]*[-*+] \[ \] \S/;
		const returnedItems = uncheckedMatches
			.filter((m) => hasContent.test(m[1]))
			.map((m) => m[1].replace(/\s*✅.*$/, ""));

		const newMain =
			returnedItems.length > 0
				? main
					? `${main}\n${returnedItems.join("\n")}`
					: returnedItems.join("\n")
				: main;
		const newContent = cleanedSection
			? `${newMain}\n\n${this.getHeaderStr()}\n${cleanedSection}`
			: newMain;

		// Cursor adjustment: start from pre-change cursor, subtract lines removed above it
		// (in completed), add lines inserted into main before it (returned items, only relevant
		// when cursor is already in completed and the section shifts down).
		const preCursorLine = editor.getCursor().line;
		const headerLine = content.substring(0, match.index).split("\n").length - 1;
		const cursorInCompleted = preCursorLine > headerLine;

		const leadingTrim = rawAfterHeader.length - afterHeader.length;
		const afterHeaderDocLine =
			content.substring(0, match.index + match[0].length + leadingTrim).split("\n").length - 1;

		// Use the same predicate as uncheckedRegex so we only count actually-removed lines.
		const removedPredicate = cleanEmpty
			? /^[ \t]*[-*+] \[ \] /
			: /^[ \t]*[-*+] \[ \] \S/;
		const removedAboveCursor = afterHeader
			.split("\n")
			.slice(0, Math.max(0, preCursorLine - afterHeaderDocLine))
			.filter((l) => removedPredicate.test(l)).length;

		const cursorLine = Math.max(
			0,
			preCursorLine - removedAboveCursor + (cursorInCompleted ? returnedItems.length : 0)
		);

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, newContent, cursorLine);
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
		const cursor = editor.getCursor();
		const { main, completedItems: existing } = this.splitContent(content);

		const completedRegex = /^([ \t]*[-*+] \[[xX]\] \S.*)\r?\n?/gm;
		const newItems = [...main.matchAll(completedRegex)].map((m) => m[1]);

		if (newItems.length === 0) {
			if (!silent) new Notice("No completed items to move.");
			return;
		}

		// Count [x] lines removed above the cursor so we can land on the right line
		const singleItemRegex = /^[ \t]*[-*+] \[[xX]\] \S.*/;
		const mainLines = main.split("\n");
		let removedAbove = 0;
		for (let i = 0; i < Math.min(cursor.line, mainLines.length); i++) {
			if (singleItemRegex.test(mainLines[i])) removedAbove++;
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
			.replace(/^[ \t]*[-*+] \[[xX ]\] [ \t]*$/gm, "")
			.replace(/\n{3,}/g, "\n\n")
			.trimEnd();

		const completedSection = `${this.getHeaderStr()}\n${allItems.join("\n")}`;
		const newContent = cleanMain
			? `${cleanMain}\n\n${completedSection}`
			: completedSection;

		this.isProcessing = true;
		this.setValuePreservingScroll(
			editor,
			newContent,
			Math.max(0, cursor.line - removedAbove)
		);
		this.isProcessing = false;
	}

	// Called by CheckboxSuggest when an autocomplete suggestion is accepted.
	// Rebuilds the line being typed with its own checkbox state and the chosen
	// task text, then deletes the original occurrence. If the source item had a
	// different state, this effectively changes its state to the typing line's.
	applyCheckboxSuggestion(
		editor: Editor,
		sourceLine: number,
		targetLine: number,
		text: string
	): void {
		if (this.isProcessing) return;

		const lines = editor.getValue().split("\n");
		if (
			sourceLine < 0 ||
			sourceLine >= lines.length ||
			targetLine < 0 ||
			targetLine >= lines.length ||
			sourceLine === targetLine
		) {
			return;
		}

		// m[0] is the "<indent>- [<state>] " prefix of the line being typed.
		const prefix = /^\s*[-*+] \[[ xX]\] /.exec(lines[targetLine]);
		if (!prefix) return;

		lines[targetLine] = `${prefix[0]}${text}`;
		lines.splice(sourceLine, 1);

		// Removing a line above the target shifts the target up by one.
		const finalLine = sourceLine < targetLine ? targetLine - 1 : targetLine;

		// Pulling the source out may leave the completed area empty; if so, drop
		// its now-orphaned header. This only ever trims content below the target
		// line, so finalLine stays valid.
		const newContent = this.dropEmptyCompletedSection(lines.join("\n"));

		this.isProcessing = true;
		this.setValuePreservingScroll(editor, newContent, finalLine);
		this.isProcessing = false;
	}

	// If the completed area has no content left under its header, remove the
	// header (and any trailing whitespace) so no empty section lingers.
	private dropEmptyCompletedSection(content: string): string {
		const match = this.getHeaderRegex().exec(content);
		if (!match) return content;

		const afterHeader = content.substring(match.index + match[0].length);
		if (afterHeader.trim() !== "") return content;

		return content.substring(0, match.index).trimEnd();
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

	private setValuePreservingScroll(
		editor: Editor,
		content: string,
		cursorLine?: number
	): void {
		const scroll = editor.getScrollInfo();
		editor.setValue(content);
		const line = Math.min(
			cursorLine ?? editor.getCursor().line,
			editor.lineCount() - 1
		);
		editor.setCursor({ line, ch: editor.getLine(line).length });
		this.lastCursorLine = line;
		this.lastCheckboxSnapshot = this.getCheckboxSnapshot(content);
		requestAnimationFrame(() => {
			editor.scrollTo(scroll.left, scroll.top);
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

interface CheckboxSuggestion {
	text: string;
	checked: boolean;
	line: number;
}

// Autocomplete for checkbox tasks: while typing in a checkbox, suggest tasks
// from elsewhere in the note whose text starts with what you've typed. Accepting
// a suggestion moves that task onto the line being typed (see
// CheckSortedPlugin.applyCheckboxSuggestion).
class CheckboxSuggest extends EditorSuggest<CheckboxSuggestion> {
	private plugin: CheckSortedPlugin;

	constructor(plugin: CheckSortedPlugin) {
		super(plugin.app);
		this.plugin = plugin;
	}

	onTrigger(
		cursor: EditorPosition,
		editor: Editor
	): EditorSuggestTriggerInfo | null {
		if (!this.plugin.settings.autocomplete) return null;

		const line = editor.getLine(cursor.line);
		const prefix = /^\s*[-*+] \[[ xX]\] /.exec(line);
		if (!prefix) return null;

		const textStart = prefix[0].length;
		if (cursor.ch < textStart) return null;

		const query = line.substring(textStart, cursor.ch);
		if (query.trim().length === 0) return null;

		return {
			start: { line: cursor.line, ch: textStart },
			end: cursor,
			query,
		};
	}

	getSuggestions(context: EditorSuggestContext): CheckboxSuggestion[] {
		const query = context.query.toLowerCase();
		const currentLine = context.start.line;
		const lines = context.editor.getValue().split("\n");
		const itemRegex = /^\s*[-*+] \[([ xX])\] (.*)$/;

		const seen = new Set<string>();
		const results: CheckboxSuggestion[] = [];

		for (let i = 0; i < lines.length && results.length < 8; i++) {
			if (i === currentLine) continue;
			const m = itemRegex.exec(lines[i]);
			if (!m) continue;

			// Match on the task text only, ignoring any "✅ <date>" stamp.
			const text = m[2].replace(/\s*✅.*$/, "").trim();
			if (!text || !text.toLowerCase().startsWith(query)) continue;

			const checked = m[1] !== " ";
			const key = `${checked ? "1" : "0"}:${text.toLowerCase()}`;
			if (seen.has(key)) continue;
			seen.add(key);

			results.push({ text, checked, line: i });
		}

		return results;
	}

	renderSuggestion(item: CheckboxSuggestion, el: HTMLElement): void {
		el.createSpan({
			cls: "checksorted-suggest-state",
			text: item.checked ? "☑" : "☐",
		});
		el.createSpan({ text: item.text });
	}

	selectSuggestion(item: CheckboxSuggestion): void {
		if (!this.context) return;
		this.plugin.applyCheckboxSuggestion(
			this.context.editor,
			item.line,
			this.context.start.line,
			item.text
		);
		this.close();
	}
}

// A clickable "×" rendered at the end of a checkbox line that deletes that line.
class DeleteTaskWidget extends WidgetType {
	toDOM(view: EditorView): HTMLElement {
		const btn = createSpan({
			cls: "checksorted-delete-task",
			text: "×",
			attr: { "aria-label": "Delete task" },
		});
		btn.addEventListener("mousedown", (e) => {
			// Stop the editor from moving the cursor / starting a selection.
			e.preventDefault();
			e.stopPropagation();
			const pos = view.posAtDOM(btn);
			const line = view.state.doc.lineAt(pos);
			const isLast = line.to >= view.state.doc.length;
			// Remove the line and one adjacent newline so no blank gap remains.
			const from = isLast && line.from > 0 ? line.from - 1 : line.from;
			const to = isLast ? line.to : line.to + 1;
			view.dispatch({ changes: { from, to, insert: "" } });
		});
		return btn;
	}

	eq(): boolean {
		return true;
	}

	ignoreEvent(): boolean {
		return true;
	}
}

// Editor extension that puts a DeleteTaskWidget at the end of every checkbox line.
function deleteButtonExtension(plugin: CheckSortedPlugin) {
	const checkbox = /^\s*[-*+] \[[ xX]\]\s/;

	return ViewPlugin.fromClass(
		class {
			decorations: DecorationSet;

			constructor(view: EditorView) {
				this.decorations = this.build(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.viewportChanged) {
					this.decorations = this.build(update.view);
				}
			}

			build(view: EditorView): DecorationSet {
				const builder = new RangeSetBuilder<Decoration>();
				if (!plugin.settings.showDeleteButton) return builder.finish();

				for (const { from, to } of view.visibleRanges) {
					let pos = from;
					while (pos <= to) {
						const line = view.state.doc.lineAt(pos);
						if (checkbox.test(line.text)) {
							builder.add(
								line.to,
								line.to,
								Decoration.widget({
									widget: new DeleteTaskWidget(),
									side: 1,
								})
							);
						}
						pos = line.to + 1;
					}
				}
				return builder.finish();
			}
		},
		{
			decorations: (v) => v.decorations,
		}
	);
}
