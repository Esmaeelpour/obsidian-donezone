# DoneZone

An [Obsidian](https://obsidian.md) plugin that moves completed to-do items into a dedicated **Done Zone** section at the bottom of your note — keeping your active tasks clean and your completed ones archived in place.

![Obsidian minAppVersion](https://img.shields.io/badge/Obsidian-1.4%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Move completed items** — sends all checked `- [x]` tasks to a collapsible completed area
- **Restore items** — unchecks and returns completed items back to the main list
- **Clear completed area** — permanently removes all completed items and the section header
- **Auto-move on complete** — automatically moves items the moment you check them (optional)
- **Date stamping** — appends a completion date (e.g. `✅ 2026-06-19`) when items are moved
- **Sort order** — choose whether new items are appended to the bottom or prepended to the top of the completed area
- **Configurable header** — set the heading level (H1–H6) and name of the completed section
- **Ribbon icon** — one-click access from the sidebar (can be hidden)

---

## Usage

### Commands

All commands are available via the Command Palette (`Ctrl/Cmd + P`):

| Command | Description |
|---|---|
| **Move completed items to completed area** | Moves all `- [x]` items from your note body into the completed section |
| **Restore all items from completed area** | Unchecks items and moves them back to the note body |
| **Clear completed area** | Deletes the completed section and all items in it |

You can assign custom hotkeys to any of these in **Settings → Hotkeys**.

### Example

Before running Move:

```markdown
- [ ] Write proposal
- [x] Research topic
- [ ] Schedule meeting
- [x] Review notes
```

After running Move:

```markdown
- [ ] Write proposal
- [ ] Schedule meeting

## Completed
- [x] Research topic
- [x] Review notes
```

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Header level | H2 | Heading level for the completed section |
| Header name | `Completed` | Text of the completed section heading |
| Show ribbon icon | On | Display the move icon in the left sidebar |
| Auto-move on complete | Off | Automatically move items when checked |
| Date stamp | Off | Append `✅ <date>` when items are moved |
| Date format | `YYYY-MM-DD` | [Moment.js](https://momentjs.com/docs/#/displaying/format/) format for the stamp |
| New items order | Append | Add new completed items at the bottom or top of the section |

---

## Installation

### Manual (until listed in community plugins)

1. Run `npm install && npm run build` in this repo
2. Copy `main.js` and `manifest.json` into your vault at:
   ```
   <vault>/.obsidian/plugins/donezone/
   ```
3. Reload Obsidian and enable **DoneZone** in **Settings → Community Plugins**

---

## Credits

DoneZone is a modern rewrite of [obsidian-completed-area](https://github.com/DahaWong/obsidian-completed-area) by [DahaWong](https://github.com/DahaWong), originally released under the MIT license.

The core concept — moving completed to-do items to a separate section — comes entirely from that project. DoneZone updates it to use the current Obsidian Editor API (replacing the deprecated CodeMirror 5 / `activeLeaf` APIs) and adds new features.

---

## License

MIT
