import {
	App,
	Plugin,
	PluginManifest,
	PluginSettingTab,
	Setting,
} from "obsidian";

import { EditorSelection } from "@codemirror/state";
import { keymap } from "@codemirror/view";

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
			console.log("clipboard text", text);
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

									const isCheckboxShortcut =
										view.state.sliceDoc(
											range.from - 2,
											range.to
										);

									const isBeginningOfLine =
										view.state.doc.lineAt(range.from)
											.from ===
										range.from - 2;

									if (
										isCheckboxShortcut === "[]" &&
										isBeginningOfLine
									) {
										hasChanged = true;
										return {
											changes: [
												{
													from: range.from - 2,
													to: range.from,
													insert: "- [ ] ",
												},
											],
											range: EditorSelection.range(
												range.from + 4,
												range.from + 4
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

	onKeyDown(cm: CodeMirror.Editor, event: KeyboardEvent) {
		// handle keydown event
		console.log("keydown", event);
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

class NotionRichtextShortcutsSettingsTab extends PluginSettingTab {
	plugin: NotionRichtextShortcutsPlugin;

	constructor(app: App, plugin: NotionRichtextShortcutsPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName("Setting #1")
			.setDesc("It's a secret")
			.addText((text) =>
				text
					.setPlaceholder("Enter your secret")
					.setValue(this.plugin.settings.mySetting)
					.onChange(async (value) => {
						this.plugin.settings.mySetting = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
