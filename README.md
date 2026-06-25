# Stale Check Organizer

Local React tool for reconciling stale check spreadsheets.

## Setup

```bash
npm install
npm run dev
```

If PowerShell blocks npm scripts, use the Windows executable directly:

```bash
npm.cmd install
npm.cmd run dev
```

## Step 1 Behavior

- Upload an Excel spreadsheet with `File #` and `Type / Check #` columns.
- Each row gets a composite key: `File #` + `_` + `Type / Check #`.
- If a composite key already exists in `localStorage`, the old record is kept entirely.
- If a row is new, it is saved with status `Untouched`.
