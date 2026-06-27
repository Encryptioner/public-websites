/**
 * storage.js — browser persistence (localStorage). No server, fully private.
 *
 *   EC_STATE   — the current working calculation (auto-saved on every change)
 *   EC_HISTORY — array of explicitly saved calculations (the History list)
 *   EC_LANG    — preferred language
 *
 * Everything is JSON; reads/writes are wrapped so a corrupt or full store
 * never crashes the app.
 */
(function () {
  "use strict";

  const K_STATE = "EC_STATE";
  const K_HISTORY = "EC_HISTORY";
  const K_LANG = "EC_LANG";

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (_) {
      return false; // private mode / quota — fail quietly
    }
  }

  function loadState() {
    return read(K_STATE, null);
  }
  function saveState(state) {
    return write(K_STATE, state);
  }

  function getHistory() {
    const h = read(K_HISTORY, []);
    return Array.isArray(h) ? h : [];
  }
  // Save a snapshot to history. Returns the saved entry.
  function addToHistory(state) {
    const history = getHistory();
    const entry = {
      id: "c" + Date.now() + Math.floor(Math.random() * 1000),
      title: state.title || "Untitled",
      savedAt: new Date().toISOString(),
      state: state,
    };
    history.unshift(entry);
    // keep the list bounded
    write(K_HISTORY, history.slice(0, 50));
    return entry;
  }
  function deleteHistory(id) {
    write(
      K_HISTORY,
      getHistory().filter((e) => e.id !== id)
    );
  }

  function getLang() {
    return read(K_LANG, null);
  }
  function setLang(lang) {
    write(K_LANG, lang);
  }

  window.ECStore = {
    loadState,
    saveState,
    getHistory,
    addToHistory,
    deleteHistory,
    getLang,
    setLang,
  };
})();
