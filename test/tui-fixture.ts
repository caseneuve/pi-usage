import type { Terminal, TUI } from "@earendil-works/pi-tui";

export function createTestTui(requestRender: () => void): TUI {
  const terminal: Terminal = {
    start() {},
    stop() {},
    async drainInput() {},
    write() {},
    get columns() {
      return 120;
    },
    get rows() {
      return 40;
    },
    get kittyProtocolActive() {
      return false;
    },
    moveBy() {},
    hideCursor() {},
    showCursor() {},
    clearLine() {},
    clearFromCursor() {},
    clearScreen() {},
    setTitle() {},
    setProgress() {},
    setProgramStatus() {},
  };

  return {
    mode: "regular",
    children: [],
    terminal,
    fullRedraws: 0,
    render() {
      return [];
    },
    invalidate() {},
    addChild() {},
    removeChild() {},
    clear() {},
    getShowHardwareCursor() {
      return false;
    },
    setShowHardwareCursor() {},
    getClearOnShrink() {
      return false;
    },
    setClearOnShrink() {},
    setFocus() {},
    showOverlay() {
      throw new Error("Overlays are not used in this test");
    },
    hideOverlay() {},
    hasOverlay() {
      return false;
    },
    start() {},
    stop() {},
    renderNow() {},
    requestRender,
    addInputListener() {
      return () => {};
    },
    removeInputListener() {},
    onTerminalColorSchemeChange() {
      return () => {};
    },
    setTerminalColorSchemeNotifications() {},
    async queryTerminalColors() {
      return {};
    },
  };
}
