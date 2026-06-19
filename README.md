# DoneZone

An [Obsidian](https://obsidian.md) plugin that moves completed to-do items into a dedicated **Done Zone** section at the bottom of your note; keeping your active tasks clean and your completed ones archived in place.

![Obsidian minAppVersion](https://img.shields.io/badge/Obsidian-1.4%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

- **Move completed items** — sends all checked `- [x]` tasks to the completed area
- **Auto-return** — unchecking an item in the completed area sends it back automatically
- **Restore items** — uncheck and return all completed items at once via command
- **Clear completed area** — permanently removes all completed items and the section header
- **Auto-move** — optionally move items the moment they are checked
- **Status bar toggle** — shows auto-move state (`✓` / `✗`) and toggles it on click
- **Date stamping** — appends a completion date (e.g. `✅ 2026-06-19`) when items are moved
- **Sort order** — append new items to the bottom or prepend to the top of the completed area
- **Configurable header** — set the heading level (H1–H6) and name of the completed section
- **Ribbon icon** — one-click trigger from the left sidebar (can be hidden)

---

## Usage

### Commands

All commands are available via the Command Palette (`Ctrl/Cmd + P`):

| Command | Description |
|---|---|
| **Move completed items to completed area** | Moves all `- [x]` items from your note body into the completed section |
| **Restore all items from completed area** | Unchecks all items and moves them back to the note body |
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

Unchecking an item in the completed area automatically returns it to the main list.

---

## Settings

| Setting | Default | Description |
|---|---|---|
| Header level | H2 | Heading level for the completed section |
| Header name | `Completed` | Text of the completed section heading |
| Show ribbon icon | On | Display the trigger icon in the left sidebar |
| Show status bar toggle | Off | Show `DoneZone ✓ / ✗` in the bottom status bar — click to toggle auto-move |
| Auto-move on complete | Off | Automatically move items to the completed area when checked |
| Date stamp | Off | Append `✅ <date>` when items are moved |
| Date format | `YYYY-MM-DD` | [Moment.js](https://momentjs.com/docs/#/displaying/format/) format for the stamp |
| New items order | Append | Add new completed items at the bottom or top of the section |

---

## Installation

### Using BRAT (recommended)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) lets you install plugins directly from GitHub without waiting for community store approval.

1. Install **BRAT** from the Obsidian community plugins
2. Open BRAT settings and click **Add Beta Plugin**
3. Paste this URL: `https://github.com/Esmaeelpour/obsidian-donezone`
4. Enable **DoneZone** in **Settings → Community Plugins**

BRAT will also handle updates automatically.

### Manual

1. Download `main.js` and `manifest.json` from the [latest release](https://github.com/Esmaeelpour/obsidian-donezone/releases)
2. Copy both files into your vault at `.obsidian/plugins/donezone/`
3. Reload Obsidian and enable **DoneZone** in **Settings → Community Plugins**

---

## Credits

Inspired by [obsidian-completed-area](https://github.com/DahaWong/obsidian-completed-area) by [DahaWong](https://github.com/DahaWong).

---

## License

MIT
