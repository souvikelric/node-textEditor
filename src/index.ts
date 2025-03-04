#!/usr/bin/env node
import blessed from "blessed";
import fs from "node:fs";
import chalk, { ChalkInstance } from "chalk";

const colouredMessage = (color: ChalkInstance, message: string) => {};

const screen = blessed.screen({
  smartCSR: true,
  fullUnicode: true,
  useBCE: true,
  autoPadding: true,
  terminal: "xterm-256color",
});

// Text buffer (welcome message and controls)
let buffer = [
  "Welcome to Vim-like Node.js Editor",
  "",
  "Controls: h (left), l (right), j (down), k (up), q (quit)",
];
let cursorX = 0;
let cursorY = 0;
let isInsertMode = false;
let commandMode = false;
let command = "";

const textArea = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: "95%",
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

const statusBar = blessed.box({
  bottom: 0,
  left: 0,
  width: "100%",
  height: "10%",
  tags: false,
  content: "NORMAL",
  style: {
    fg: "white",
    bg: "lightblue",
  },
});

screen.append(textArea);
screen.append(statusBar);

screen.key(["up", "down", "left", "right"], (ch, key) => {
  if (!isInsertMode && !commandMode) {
    if (key.name === "left" && cursorX > 0) cursorX--;
    if (key.name === "right" && cursorX < (buffer[cursorY]?.length || 0))
      cursorX++;
    if (key.name === "down" && cursorY < buffer.length - 1) cursorY++;
    if (key.name === "up" && cursorY > 0) cursorY--;
    render();
  }
});

// Enter insert mode
screen.key(["i"], () => {
  if (!commandMode) {
    isInsertMode = true;
    screen.program.showCursor();
    buffer = [""];
    cursorX = 0;
    cursorY = 0;
    statusBar.setContent("INSERT");
    render();
  }
});

// Exit insert mode (ESC key)
screen.key(["escape"], () => {
  isInsertMode = false;
  commandMode = false;
  command = "";
  statusBar.setContent("NORMAL");
  screen.render();
});

screen.on("keypress", (ch, key) => {
  if (isInsertMode && key.sequence && !key.ctrl) {
    if (buffer.length > 0) {
      buffer[cursorY] =
        buffer[cursorY].slice(0, cursorX) + ch + buffer[cursorY].slice(cursorX);
    }
    cursorX++;
    render();
  } else if (!isInsertMode && key.name === ":") {
    commandMode = true;
    command = ":";
    statusBar.setContent(command);
    screen.render();
  } else if (commandMode && key.name !== "escape") {
    command += ch;
    statusBar.setContent(command);
    screen.render();
  } else if (commandMode && key.name === "enter") {
    handleCommand();
  }
});

// Handle save and quit commands
function handleCommand() {
  if (command === ":w") {
    fs.writeFileSync("output.txt", buffer.join("\n"));
    statusBar.setContent("Saved to output.txt");
  } else if (command === ":q") {
    process.exit(0);
  }
  command = "";
  commandMode = false;
  statusBar.setContent("NORMAL");
  screen.render();
}

screen.key(["q"], () => process.exit(0));

// Center text vertically and horizontally
function centerText(lines: string[]) {
  const terminalWidth: number = Number(screen.width.valueOf());
  const terminalHeight: number = Number(screen.height.valueOf());
  const centeredLines = lines.map((line) => {
    const padding = Math.max(0, Math.floor((terminalWidth - line.length) / 2));
    return " ".repeat(padding) + line;
  });

  const verticalPadding = Math.max(
    0,
    Math.floor((terminalHeight - lines.length) / 2)
  );
  return "\n".repeat(verticalPadding) + centeredLines.join("\n");
}

function render() {
  textArea.setContent(centerText(buffer));
  screen.render();
  screen.program.cursorPos(cursorY, cursorX);
}

render();
