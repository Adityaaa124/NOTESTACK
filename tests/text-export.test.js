/**
 * Text Export Tests for NoteStack
 * Member 4 - ROSPL Project
 * Zero-dependency standalone test runner using Node.js built-in assertion module.
 *
 * Tests cover FR-07: Export notes to a text file.
 * Note: downloadTxtFile() is a browser-only API (Blob/URL); we test the
 * text-building logic (formatNoteForExport) and export guard conditions separately.
 */

const assert = require("assert");

// ──────────────────────────────────────────────
// Pure logic functions extracted from script.js
// ──────────────────────────────────────────────

function formatNoteForExport(note, index) {
    const sep = "============================================================\r\n";
    const thinSep = "------------------------------------------------------------\r\n";
    let out = "";
    if (index !== undefined && index !== null) {
        out += `Note #${index + 1}\r\n`;
    }
    out += sep;
    out += `Title   : ${note.title || "Untitled Note"}\r\n`;
    out += `Subject : ${note.subject || "General"}\r\n`;
    if (note.labels && note.labels.length > 0) {
        out += `Labels  : ${note.labels.join(", ")}\r\n`;
    }
    if (note.folder) {
        out += `Folder  : ${note.folder}\r\n`;
    }
    const created = note.createdAt ? new Date(note.createdAt).toLocaleString() : "";
    const updated = note.updatedAt ? new Date(note.updatedAt).toLocaleString() : "";
    if (created) out += `Created : ${created}\r\n`;
    if (updated && updated !== created) out += `Updated : ${updated}\r\n`;
    out += thinSep;
    out += `${note.content || note.text || ""}\r\n`;
    return out;
}

/**
 * Builds the full multi-note export text content (mirrors exportAllNotes logic).
 * Returns null if the collection is empty.
 */
function buildExportText(notes) {
    if (!notes || notes.length === 0) return null;

    const formattedDate = new Date().toLocaleString();
    const bigSep = "============================================================\r\n";

    let textContent = "";
    textContent += "                    NOTESTACK — STUDENT NOTES                    \r\n";
    textContent += bigSep;
    textContent += `Exported on : ${formattedDate}\r\n`;
    textContent += `Total Notes : ${notes.length}\r\n`;
    textContent += bigSep + "\r\n";

    notes.forEach((note, idx) => {
        textContent += formatNoteForExport(note, idx) + "\r\n";
    });

    return textContent;
}

/**
 * Builds a safe filename slug from a note title (mirrors exportSingleNote logic).
 */
function buildSafeFilename(title) {
    const rawSlug = (title || "note").trim().slice(0, 40);
    const safeSlug = rawSlug.replace(/[^a-zA-Z0-9_\-\u00C0-\u024F]/g, "_").replace(/_+/g, "_").toLowerCase();
    return `note-${safeSlug || "export"}.txt`;
}

// ──────────────────────────────────────────────
// Test Runner
// ──────────────────────────────────────────────

let total = 0;
let passed = 0;

function runTest(id, desc, fn) {
    total++;
    try {
        fn();
        passed++;
        console.log(`  [PASS] ${id}: ${desc}`);
    } catch (err) {
        console.error(`  [FAIL] ${id}: ${desc}`);
        console.error(`         ${err.message}`);
    }
}

console.log("\n========================================================");
console.log("RUNNING TEXT EXPORT TEST SUITE");
console.log("========================================================\n");

const sampleNote = {
    id: "1",
    title: "Database Normalization",
    subject: "DBMS",
    content: "1NF, 2NF, 3NF and BCNF guidelines.",
    text: "1NF, 2NF, 3NF and BCNF guidelines.",
    labels: ["Important"],
    folder: "DBMS",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: "2026-10-05T15:30:00.000Z"
};

const sampleNote2 = {
    id: "2",
    title: "OS Scheduling",
    subject: "OS",
    content: "Round robin, FCFS, Priority scheduling.",
    text: "Round robin, FCFS, Priority scheduling.",
    labels: [],
    folder: "",
    createdAt: "2026-10-02T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z"
};

// EX-01: formatNoteForExport includes all expected fields
runTest("EX-01", "Formatted note contains title, subject, content fields", () => {
    const output = formatNoteForExport(sampleNote, 0);
    assert(output.includes("Database Normalization"), "Title missing");
    assert(output.includes("DBMS"), "Subject missing");
    assert(output.includes("1NF, 2NF, 3NF"), "Content missing");
});

// EX-02: Labels are included when present
runTest("EX-02", "Formatted note includes labels when they exist", () => {
    const output = formatNoteForExport(sampleNote, 0);
    assert(output.includes("Important"), "Labels missing");
});

// EX-03: Note without labels does not produce a labels line
runTest("EX-03", "Formatted note without labels does not include Labels line", () => {
    const output = formatNoteForExport(sampleNote2, 1);
    assert(!output.includes("Labels  :"), "Labels line should not appear");
});

// EX-04: Folder field included when set
runTest("EX-04", "Formatted note includes Folder when folder is set", () => {
    const output = formatNoteForExport(sampleNote, 0);
    assert(output.includes("Folder  :"), "Folder line missing");
});

// EX-05: Note number index appears correctly
runTest("EX-05", "Formatted note shows correct note number (index + 1)", () => {
    const output0 = formatNoteForExport(sampleNote, 0);
    const output1 = formatNoteForExport(sampleNote2, 1);
    assert(output0.includes("Note #1"), "Should show Note #1 for index 0");
    assert(output1.includes("Note #2"), "Should show Note #2 for index 1");
});

// EX-06: buildExportText returns null for empty collection
runTest("EX-06", "buildExportText returns null when notes array is empty", () => {
    assert.strictEqual(buildExportText([]), null);
    assert.strictEqual(buildExportText(null), null);
});

// EX-07: buildExportText includes header and all notes
runTest("EX-07", "buildExportText includes header and all note content", () => {
    const text = buildExportText([sampleNote, sampleNote2]);
    assert(text !== null);
    assert(text.includes("NOTESTACK"), "Header missing");
    assert(text.includes("Total Notes : 2"), "Total count wrong");
    assert(text.includes("Database Normalization"), "Note 1 title missing");
    assert(text.includes("OS Scheduling"), "Note 2 title missing");
});

// EX-08: Export text does not alter source notes
runTest("EX-08", "buildExportText does not mutate the notes array", () => {
    const notes = [{ ...sampleNote }, { ...sampleNote2 }];
    const originalIds = notes.map(n => n.id);
    buildExportText(notes);
    assert.deepStrictEqual(notes.map(n => n.id), originalIds, "Notes array was mutated");
});

// EX-09: Safe filename from normal title
runTest("EX-09", "buildSafeFilename produces safe, lowercase .txt filename", () => {
    const filename = buildSafeFilename("Database Normalization");
    assert(filename.endsWith(".txt"), "Must end with .txt");
    assert(/^[a-z0-9_\-]+\.txt$/.test(filename), `Unsafe chars in filename: ${filename}`);
});

// EX-10: Safe filename from title with special chars
runTest("EX-10", "buildSafeFilename sanitises punctuation and special characters", () => {
    const filename = buildSafeFilename("C++ & Algorithms: Sorting (Advanced)!");
    assert(filename.endsWith(".txt"));
    assert(!/[!&:()+]/.test(filename), `Special chars not removed: ${filename}`);
});

// EX-11: Safe filename from empty/blank title
runTest("EX-11", "buildSafeFilename produces a safe .txt filename for blank/null title", () => {
    // Empty string → title || "note" → "note" → "note-note.txt" (safe fallback)
    const filename = buildSafeFilename("");
    assert(filename.endsWith(".txt"), "Must end with .txt");
    assert(/^[a-z0-9_\-]+\.txt$/.test(filename), `Unsafe chars in blank-title filename: ${filename}`);
    // null title → same safe fallback
    const filename2 = buildSafeFilename(null);
    assert(filename2.endsWith(".txt"), "Must end with .txt");
    assert(/^[a-z0-9_\-]+\.txt$/.test(filename2), `Unsafe chars in null-title filename: ${filename2}`);
});

// EX-12: Untitled note (no title) renders fallback in export
runTest("EX-12", "formatNoteForExport uses 'Untitled Note' for missing title", () => {
    const noteNoTitle = { ...sampleNote2, title: "" };
    const output = formatNoteForExport(noteNoTitle, 0);
    assert(output.includes("Untitled Note"), "Fallback title missing");
});

// EX-13: Unicode content renders correctly (no corruption)
runTest("EX-13", "formatNoteForExport preserves Unicode content", () => {
    const unicodeNote = {
        id: "u1",
        title: "数学ノート",
        subject: "Maths",
        content: "∫x²dx = x³/3 + C, π ≈ 3.14159, café résumé",
        labels: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const output = formatNoteForExport(unicodeNote, 0);
    assert(output.includes("数学ノート"), "Unicode title missing");
    assert(output.includes("∫x²dx"), "Math symbols missing");
    assert(output.includes("café"), "Accented chars missing");
});

// EX-14: Single-note export (exportSingleNote path) contains only one note
runTest("EX-14", "Single note export text contains only the target note's content", () => {
    // Simulate exportSingleNote text build
    const bigSep = "============================================================\r\n";
    let textContent = "                    NOTESTACK — STUDENT NOTE                     \r\n";
    textContent += bigSep;
    textContent += formatNoteForExport(sampleNote) + "\r\n";

    assert(textContent.includes("Database Normalization"), "Target note missing");
    assert(!textContent.includes("OS Scheduling"), "Unexpected note in single export");
});

console.log("\n--------------------------------------------------------");
console.log(`TEST SUMMARY: ${passed}/${total} Passed (${total - passed} Failed)`);
console.log("========================================================\n");

if (passed !== total) {
    process.exit(1);
}
