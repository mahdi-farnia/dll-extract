#! /usr/bin/env node

import { createInterface } from "node:readline/promises";
import { open, copyFile, access, constants, stat } from "node:fs/promises";
import { extname, join, basename } from "node:path";
import logUpdate from 'log-update';

console.log("NOTE: you should run this script as root\n")

const tty = createInterface({ input: process.stdin, output: process.stdout });
const src = await getPath("Enter file path containing DLLs paths: ", (stat) => stat.isFile());
const dest = await getPath("Enter destination folder to copy DLLs: ", (stat) => stat.isDirectory());

console.log("🔎 Coping DLL files");
await copyDLLs(src, dest);

tty.close();

async function copyDLLs(logFilePath, dirname) {
    let logFile;
    let foundCount = 0;

    try {
        logFile = await open(logFilePath, 'r');
        const $sharepoint = /sharepoint/i;
    
        for await (const path of logFile.readLines()) {
            if ($sharepoint.test(path) && (extname(path).toLowerCase() === '.dll')) {
                await access(path, constants.F_OK); // is visible to this process?
                await copyFile(path, join(dirname, basename(path)), constants.COPYFILE_FICLONE);
                logUpdate(`Items copied: ${++foundCount}`);
            }
        }
    } catch (err) {
        console.error('Error finding DLL files:');
        console.error(err instanceof Error ? err.message : err);
    }

    await logFile?.close();
}

async function getPath(prompt, checker) {
    let dest;
    while (true) {
        dest = await tty.question(prompt);
        
        if (!checker(await stat(dest))) {
            console.log('Invalid path!')
        } else return dest;
    }
}
