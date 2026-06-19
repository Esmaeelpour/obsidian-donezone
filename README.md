# DoneZone

An [Obsidian](https://obsidian.md) plugin that moves completed to-do items into a dedicated **Done Zone** section at the bottom of your note; keeping your active tasks clean and your completed ones archived in place.

![Obsidian minAppVersion](https://img.shields.io/badge/Obsidian-1.4%2B-7c3aed)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Features

#### Move tasks where they belong

Check a task and it slips into a **Completed** section at the foot of your note. Do it on demand from the command palette or ribbon, or turn on **auto-move** and watch each task leave the instant you tick it. Uncheck something by mistake? It quietly returns to your active list on its own.

#### Sync both ways in one click

The sidebar ribbon runs a full pass: completed tasks move down, anything you un-ticked moves back up, and leftover empty checkboxes are swept away; so neither list ever drifts out of sync.

#### Autocomplete tasks as you type

Start typing in a checkbox and DoneZone suggests matching tasks from anywhere in the note, done or not. Pick one and that task hops onto the line you're typing, with its original copy removed, so duplicates collapse into a single entry. The task lands in the state of the line you're typing: type into an unchecked box and an archived task comes back active; type into a checked box and an open task is marked done; all in one keystroke.

#### Delete a task in one click

Hover a checkbox line in the editor and a **×** appears on the right, just like Google Keep. Click it to remove that task; no selecting, no backspacing.

#### Tidy up in bulk

- **Restore all** — pull every archived task back into the active list at once
- **Clear** — delete the completed section and everything in it in a single step

#### Shape it to your workflow

- **Custom heading** — name the archive section and pick its level, H1 through H6
- **Completion dates** — stamp each finished task with a date like `✅ 2026-06-19`, in any [Moment.js](https://momentjs.com/docs/#/displaying/format/) format
- **Newest first or last**  add completed items to the top or bottom of the archive
- **Status bar toggle** — flip auto-move on or off and read its state (`✓` / `✗`) at a glance

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
| Show delete button | On | Show a × on the right of each checkbox line in the editor; click it to delete that task |
| Task autocomplete | On | Suggest matching tasks while typing in a checkbox; selecting one moves it to the line you're typing |
| Date stamp | Off | Append `✅ <date>` when items are moved |
| Date format | `YYYY-MM-DD` | [Moment.js](https://momentjs.com/docs/#/displaying/format/) format for the stamp |
| New items order | Append | Add new completed items at the bottom or top of the section |

---

## Installation

### From Community Plugins

Once approved, DoneZone will be installable directly from Obsidian:

1. Open **Settings → Community Plugins** and click **Browse**
2. Search for **DoneZone**
3. Click **Install**, then **Enable**

### Using BRAT

[BRAT](https://github.com/TfTHacker/obsidian42-brat) lets you install plugins directly from GitHub before community store approval.

1. Install **BRAT** from the Obsidian community plugins
2. Open BRAT settings and click **Add Beta Plugin**
3. Paste this URL: `https://github.com/Esmaeelpour/obsidian-donezone`
4. Enable **DoneZone** in **Settings → Community Plugins**

BRAT will also handle updates automatically.

### Manual

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/Esmaeelpour/obsidian-donezone/releases)
2. Copy all three files into your vault at `.obsidian/plugins/donezone/`
3. Reload Obsidian and enable **DoneZone** in **Settings → Community Plugins**

---

## Credits

Inspired by [obsidian-completed-area](https://github.com/DahaWong/obsidian-completed-area) by [DahaWong](https://github.com/DahaWong).

---

## License

MIT
