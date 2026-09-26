"use strict";

// Second-level labels that sit under a country code, as in example.co.uk.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "ac", "gov", "edu", "ne", "or", "go"]);

const HISTORY_LIMIT = 50;

// windowId -> tab ids, most recently focused first.
const focusHistory = new Map();

// Returns the site part of a hostname, so that mail.google.com and
// docs.google.com both give google.com.
function baseDomain(hostname) {
  const labels = hostname.split(".");
  if (labels.length <= 2 || /^[\d.]+$/.test(hostname) || hostname.includes(":")) {
    return hostname;
  }
  const tld = labels[labels.length - 1];
  const sld = labels[labels.length - 2];
  const take = tld.length === 2 && SECOND_LEVEL.has(sld) ? 3 : 2;
  return labels.slice(-take).join(".");
}

// Web pages sort by site, then host, then full URL. Other pages (about:,
// file:, moz-extension:) go after all web pages, grouped by scheme.
function sortKey(tab) {
  let url;
  try {
    url = new URL(tab.url);
  } catch {
    return ["2", "", "", tab.url || ""];
  }
  if (url.protocol === "http:" || url.protocol === "https:") {
    const host = url.hostname.replace(/^www\./, "");
    const path = url.pathname + url.search + url.hash;
    return ["1", baseDomain(host), host, path];
  }
  return ["2", url.protocol, "", tab.url];
}

function compareKeys(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}

// Tabs that play sound come first, in their current order. The rest follow,
// sorted by site. Pinned tabs do not move.
async function sortWindow(windowId) {
  const tabs = await browser.tabs.query({ windowId, pinned: false });
  const playing = tabs.filter((t) => t.audible);
  const rest = tabs.filter((t) => !t.audible);
  const keyed = rest.map((tab) => ({ tab, key: sortKey(tab) }));
  keyed.sort((a, b) => compareKeys(a.key, b.key));

  const ordered = [...playing, ...keyed.map((k) => k.tab)];
  const unchanged = ordered.every((tab, i) => tab.id === tabs[i].id);
  if (unchanged) return;

  const pinnedCount = tabs.length ? tabs[0].index : 0;
  await browser.tabs.move(ordered.map((t) => t.id), { index: pinnedCount });
}

// Moves a tab that started playing to the top of the unpinned tabs, unless it
// is already inside the block of playing tabs at the top.
async function moveToTop(tab) {
  if (tab.pinned) return;
  const tabs = await browser.tabs.query({ windowId: tab.windowId, pinned: false });
  for (const t of tabs) {
    if (t.id === tab.id) return;
    if (!t.audible) break;
  }
  const pinnedCount = tabs.length ? tabs[0].index : 0;
  await browser.tabs.move(tab.id, { index: pinnedCount });
}

function recordFocus(windowId, tabId) {
  const list = (focusHistory.get(windowId) || []).filter((id) => id !== tabId);
  list.unshift(tabId);
  list.length = Math.min(list.length, HISTORY_LIMIT);
  focusHistory.set(windowId, list);
}

function forgetTab(windowId, tabId) {
  const list = focusHistory.get(windowId);
  if (!list) return;
  const next = list.filter((id) => id !== tabId);
  if (next.length) focusHistory.set(windowId, next);
  else focusHistory.delete(windowId);
}

async function switchToPrevious() {
  const win = await browser.windows.getLastFocused();
  const list = focusHistory.get(win.id) || [];
  for (const tabId of list.slice(1)) {
    try {
      await browser.tabs.update(tabId, { active: true });
      return;
    } catch {
      forgetTab(win.id, tabId);
    }
  }
}

browser.browserAction.onClicked.addListener((tab) => {
  sortWindow(tab.windowId).catch(console.error);
});

browser.commands.onCommand.addListener((command) => {
  if (command === "previous-tab") switchToPrevious().catch(console.error);
});

browser.tabs.onUpdated.addListener(
  (tabId, changeInfo, tab) => {
    if (changeInfo.audible) moveToTop(tab).catch(console.error);
  },
  { properties: ["audible"] }
);

browser.tabs.onActivated.addListener(({ tabId, windowId }) => {
  recordFocus(windowId, tabId);
});

browser.tabs.onRemoved.addListener((tabId, { windowId }) => {
  forgetTab(windowId, tabId);
});

browser.tabs.onDetached.addListener((tabId, { oldWindowId }) => {
  forgetTab(oldWindowId, tabId);
});

browser.windows.onRemoved.addListener((windowId) => {
  focusHistory.delete(windowId);
});

browser.tabs.query({ active: true }).then((tabs) => {
  for (const tab of tabs) recordFocus(tab.windowId, tab.id);
});
