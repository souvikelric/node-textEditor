#!/usr/bin/env node
import blessed from "blessed";

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  useBCE: true,
  autoPadding: true,
  terminal: "xterm-256color",
});

let buffer = ["Welcome to Vim-like Node.js Editor"];
let cursorX = 0;
let cursorY = 0;

const textArea = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  tags: false,
  keys: true,
  vi: true,
  scrollable: true,
  alwaysScroll: false,
  content: buffer.join("\n"),
  style: {
    fg: "white",
    bg: "black",
  },
});

screen.append(textArea);

screen.key(["h", "j", "k", "l"], (ch, key) => {
  if (key.name === "h" && cursorX > 0) cursorX--; // left
  if (key.name === "l" && cursorX < (buffer[cursorY]?.length || 0) - 1)
    cursorX++; // right
  if (key.name === "j" && cursorY < buffer.length - 1) cursorY++; // down
  if (key.name === "k" && cursorY > 0) cursorY--; // up
  render();
});

screen.key(["q"], () => process.exit(0));

function render() {
  textArea.setContent(buffer.join("\n"));
  screen.render();
  screen.program.cursorPos(cursorY, cursorX);
}

render();
