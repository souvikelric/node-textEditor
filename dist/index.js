#!/usr/bin/env node
import readLine from "node:readline";
import chalk from "chalk";
import fs from "node:fs/promises";
let mode = "editing";
const rows = process.stdout.rows;
const cols = process.stdout.columns;
let statusText;
let statusColor;
const args = process.argv.slice(2);
const fileName = args.length > 0 ? args[0] : "undefined";
const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
});
let buffer = [""]; // buffer will contain all the text that we need to print out
let cursor = { row: 0, col: 0 }; // object that will contain the current cursor position
process.stdin.setRawMode(true); // to get real time input from the terminal
console.clear();
drawScreen();
process.stdin.on("data", handleKeyPress); // run the function handleKeyPress for every keypress or data input in the terminal
// process.stdin.resume();
process.on("SIGINT", () => {
    //   console.log("No quit from event");
    if (mode === "saving") {
        console.clear();
        process.exit();
    }
    else {
        process.stdin.resume();
        drawScreen();
    }
});
async function saveFile(filePath) {
    updateStatusBar("Pressed Y", chalk.green);
    try {
        await fs.writeFile(filePath, buffer.join("\n"), { encoding: "utf-8" });
        console.clear();
        console.log(`File saved as: ${filePath}`);
        process.exit(0);
    }
    catch (err) {
        console.error("Failed to save file:", err);
        mode = "editing"; // Return to editing mode if saving fails
        drawScreen();
    }
}
function handleKeyPress(data) {
    const key = data.toString("utf-8");
    //   if (mode === "saving" && key === "y") {
    //     if (fileName !== "undefined") {
    //       saveFile(
    //         path.join(
    //           process.cwd(),
    //           fileName.endsWith(".txt") ? fileName : fileName + ".txt"
    //         )
    //       );
    //       process.stdin.setRawMode(false);
    //       return;
    //     } else {
    //       mode = "editing";
    //     }
    //     return;
    //   }
    if (key === "\x03") {
        process.stdin.resume();
        mode = "saving";
        drawScreen();
        //return;
    }
    if (mode === "editing") {
        switch (key) {
            case "\x1B[A": // Up arrow
                if (cursor.row > 0)
                    cursor.row--;
                break;
            case "\x1B[B": // Down arrow
                if (cursor.row < buffer.length - 1)
                    cursor.row++;
                break;
            case "\x1B[D": // Left arrow:
                if (cursor.col > 0)
                    cursor.col--;
                break;
            case "\x1B[C": // Right arrow
                if (cursor.col < buffer[cursor.row].length - 1)
                    cursor.col++;
                break;
            case "\r": //case for pressing Enter key
                const currentLine = buffer[cursor.row];
                const beforeCursor = currentLine.slice(0, cursor.col);
                const afterCursor = currentLine.slice(cursor.col);
                buffer[cursor.row] = beforeCursor;
                buffer.splice(cursor.row + 1, 0, afterCursor);
                cursor.row++;
                cursor.col = 0;
                break;
            case "\x7F": // Backspace
                if (cursor.col > 0) {
                    const line = buffer[cursor.row];
                    buffer[cursor.row] =
                        line.slice(0, cursor.col - 1) + line.slice(cursor.col);
                    cursor.col--;
                }
                break;
            default:
                const line = buffer[cursor.row];
                buffer[cursor.row] =
                    line.slice(0, cursor.col) + key + line.slice(cursor.col);
                cursor.col++;
        }
    }
    else {
        if (key === "y") {
            updateStatusBar("Pressed Y", chalk.green);
        }
    }
    drawScreen();
}
function getWordNumber(buf) {
    let words = 0;
    buf.forEach((b) => {
        words++;
        if (b === "") {
            words--;
        }
        else {
            for (let i = 0; i < b.length; i++) {
                if (b[i] === " ")
                    words++;
            }
        }
    });
    return words;
}
function updateStatusBar(text, color) {
    const paddedStatusBar = text.padEnd(cols); // Fill the rest of the line with spaces
    process.stdout.write(color(paddedStatusBar));
}
function drawScreen() {
    console.clear();
    buffer.slice(0, rows - 1).forEach((line, i) => {
        if (i === cursor.row) {
            const beforeCursor = line.slice(0, cursor.col);
            const cursorChar = line[cursor.col] || " ";
            const afterCursor = line.slice(cursor.col + 1);
            process.stdout.write(`${beforeCursor}${chalk.inverse(cursorChar)}${afterCursor}\n`);
        }
        else {
            process.stdout.write(`${line}\n`);
        }
    });
    process.stdout.cursorTo(0, rows - 1);
    process.stdout.clearLine(0);
    const lines = buffer.length;
    const words = getWordNumber(buffer);
    if (mode === "editing") {
        statusText = `Lines: ${lines} | Words: ${words} | Row: ${cursor.row + 1}, Col: ${cursor.col + 1} | Ctrl+C to exit `;
        statusColor = chalk.bgRgb(50, 110, 180);
    }
    else {
        statusText = "In Save Mode";
        if (fileName !== "undefined") {
            statusText += ` | Save the file as ${fileName}.txt? ${mode}`;
        }
        else {
            statusText += ` | No file name mentioned | Ctrl + C again to quit`;
        }
        statusColor = chalk.bgRgb(200, 0, 10);
    }
    updateStatusBar(statusText, statusColor);
}
