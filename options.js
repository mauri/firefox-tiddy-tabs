"use strict";

// Display names for the key names that the commands API uses.
const KEY_NAMES = {
  MacCtrl: "Ctrl",
  Command: "Cmd",
  Comma: ",",
  Period: ".",
  Space: "Space",
};

function formatShortcut(shortcut) {
  return shortcut
    .split("+")
    .map((key) => KEY_NAMES[key] || key)
    .join("+");
}

async function render() {
  const commands = await browser.commands.getAll();
  const rows = document.getElementById("shortcuts");
  rows.replaceChildren();
  for (const command of commands) {
    const row = document.createElement("tr");
    const description = document.createElement("td");
    description.textContent = command.description;
    const key = document.createElement("td");
    if (command.shortcut) {
      const kbd = document.createElement("kbd");
      kbd.textContent = formatShortcut(command.shortcut);
      key.append(kbd);
    } else {
      key.textContent = "Not set";
      key.className = "unset";
    }
    row.append(description, key);
    rows.append(row);
  }
}

document.getElementById("change").addEventListener("click", () => {
  browser.commands.openShortcutSettings();
});

// The page stays open while the user edits shortcuts in another view, so it
// renders again when it becomes visible.
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) render().catch(console.error);
});

render().catch(console.error);
