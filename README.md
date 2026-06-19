# DoneZone

An [Obsidian](https://obsidian.md) plugin that moves completed to-do items into a dedicated **Done Zone** section at the bottom of your note; keeping your active tasks clean and your completed ones archived in place.

![Obsidian minAppVersion](https://img.shields.io/badge/Obsidian-1.4%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

**Organize your tasks**

- **Move completed** — collects every checked `- [x]` task into a dedicated completed area at the bottom of the note
- **Auto-return** — unchecking an item in the completed area sends it straight back to your active list
- **Restore all** — uncheck and return every completed item in one command
- **Clear** — remove all completed items and the section header in a single step

**Hands-free automation**

- **Auto-move on complete** — items jump to the completed area the moment you check them
- **Ribbon full sync** — one click returns stray unchecked items *and* moves newly completed ones, keeping both lists tidy
- **Status bar toggle** — see auto-move state at a glance (`✓` / `✗`) and flip it with a click

**Make it yours**

- **Configurable header** — choose the heading level (H1–H6) and name of the completed section
- **Date stamping** — append a completion date such as `✅ 2026-06-19`, in any [Moment.js](https://momentjs.com/docs/#/displaying/format/) format
- **Sort order** — add newly completed items to the bottom or the top of the section

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

### Ribbon icon

Clicking the DoneZone ribbon icon in the left sidebar runs a **full sync** in one step:

1. Any unchecked `- [ ]` items left in the completed area are returned to the main list (and stray empty checkboxes are cleared).
2. All checked `- [x]` items in the note body are moved into the completed area.

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
