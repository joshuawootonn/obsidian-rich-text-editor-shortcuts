import { App, Plugin, PluginManifest } from "obsidian";

import { EditorSelection } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { NotionRichtextShortcutsSettingsTab } from "./settings";

interface NotionRichtextShortcutsSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: NotionRichtextShortcutsSettings = {
	mySetting: "default",
};

export default class NotionRichtextShortcutsPlugin extends Plugin {
	settings: NotionRichtextShortcutsSettings;
	clipboardText: string;

	constructor(app: App, manifest: PluginManifest) {
		super(app, manifest);
		this.saveClipboardText = this.saveClipboardText.bind(this);
		this.clipboardText = "";
	}

	saveClipboardText() {
		navigator.clipboard.readText().then((text) => {
			this.clipboardText = text;
		});
	}

	async onload() {
		await this.loadSettings();
		this.addSettingTab(
			new NotionRichtextShortcutsSettingsTab(this.app, this)
		);
		window.document.addEventListener(
			"selectionchange",
			this.saveClipboardText
		);

		this.registerEditorExtension({
			extension: [
				keymap.of([
					{
						key: "Meta-u",
						run: (view) => {
							let hasChanged = false;

							view.dispatch(
								view.state.changeByRange((range) => {
									if (range.from === range.to)
										return { range };

									hasChanged = true;
									const selectionText = view.state.sliceDoc(
										range.from,
										range.to
									);

									if (
										selectionText.startsWith("<u>") &&
										selectionText.endsWith("</u>")
									) {
										const next = selectionText
											.replace("<u>", "")
											.replace("</u>", "");
										return {
											changes: [
												{
													from: range.from,
													to: range.to,
													insert: next,
												},
											],
											range: EditorSelection.range(
												range.from,
												range.from + next.length
											),
										};
									} else {
										const next = `<u>${selectionText}</u>`;
										return {
											changes: [
												{
													from: range.from,
													to: range.to,
													insert: next,
												},
											],
											range: EditorSelection.range(
												range.from,
												range.from + next.length
											),
										};
									}
								})
							);

							return hasChanged;
						},
					},
					{
						key: "Meta-Shift-k",
						run: (view) => {
							let hasChanged = false;

							view.dispatch(
								view.state.changeByRange((range) => {
									if (range.from === range.to)
										return { range };

									hasChanged = true;
									const selectionText = view.state.sliceDoc(
										range.from,
										range.to
									);
									const next = `[[${selectionText}]]`;
									return {
										changes: [
											{
												from: range.from,
												to: range.to,
												insert: next,
											},
										],
										range: EditorSelection.range(
											range.from + next.length - 2,
											range.from + next.length - 2
										),
									};
								})
							);

							return hasChanged;
						},
					},
					{
						key: "Meta-v",
						run: (view) => {
							let hasChanged = false;

							const clipboardText = this.clipboardText;
							try {
								const url = new URL(clipboardText);
								view.dispatch(
									view.state.changeByRange((range) => {
										if (range.from === range.to)
											return { range };

										hasChanged = true;
										const selectionText =
											view.state.sliceDoc(
												range.from,
												range.to
											);
										const next = `[${selectionText}](${url.href})`;
										return {
											changes: [
												{
													from: range.from,
													to: range.to,
													insert: next,
												},
											],
											range: EditorSelection.range(
												range.from,
												range.from + next.length
											),
										};
									})
								);
							} catch (error) {
								return hasChanged;
							}

							return hasChanged;
						},
					},
					{
						key: "Space",
						run(view) {
							let hasChanged = false;
							view.dispatch(
								view.state.changeByRange((range) => {
									if (range.from !== range.to)
										return { range };

									const checkboxCharacterCount = 6;
									const currentLine = view.state.doc.lineAt(
										range.from
									);

									const incompleteCheckboxSlice =
										view.state.sliceDoc(
											range.from - 2,
											range.to
										);

									let isBeginningOfLine =
										currentLine.from === range.from - 2;

									if (
										incompleteCheckboxSlice === "[]" &&
										isBeginningOfLine
									) {
										hasChanged = true;
										return {
											changes: [
												{
													from: currentLine.from,
													to: range.from,
													insert: "- [ ] ",
												},
											],
											range: EditorSelection.range(
												currentLine.from +
													checkboxCharacterCount,
												currentLine.from +
													checkboxCharacterCount
											),
										};
									}
									const completedCheckboxSlice =
										view.state.sliceDoc(
											range.from - 3,
											range.to
										);
									isBeginningOfLine =
										currentLine.from === range.from - 3;

									if (
										completedCheckboxSlice === "[x]" &&
										isBeginningOfLine
									) {
										hasChanged = true;
										return {
											changes: [
												{
													from: currentLine.from,
													to: range.from,
													insert: "- [x] ",
												},
											],
											range: EditorSelection.range(
												currentLine.from +
													checkboxCharacterCount,
												currentLine.from +
													checkboxCharacterCount
											),
										};
									}
									return { range };
								})
							);
							return hasChanged;
						},
					},
				]),
			],
		});
	}

	onunload() {
		window.document.removeEventListener(
			"selectionchange",
			this.saveClipboardText
		);
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
