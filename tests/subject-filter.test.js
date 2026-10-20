/**
 * Subject Filter Tests for NoteStack
 * Member 3 - ROSPL Project
 * Zero-dependency standalone test runner using Node.js built-in assertion module.
 *
 * Tests cover FR-06: Filter by subject, including combined search+filter behaviour.
 */

const assert = require("assert");

// ──────────────────────────────────────────────
// Pure logic functions extracted from script.js
// (no DOM, no LocalStorage needed here)
// ──────────────────────────────────────────────

/**
 * Derives the subjects list from an array of notes (mirrors populateSubjectFilter logic).
 * Returns unique, sorted, non-empty subject strings.
 */
function getUniqueSubjects(notes) {
    return [...new Set(
        notes
            .map(n => n.subject && n.subject.trim())
            .filter(Boolean)
    )].sort();
}

/**
 * Applies subject filter + optional title/content search to a notes array.
 * Mirrors the combined logic inside renderNotes() in script.js.
 *
 * @param {Array}  notes               Full note collection (not mutated)
 * @param {string} subjectFilter       "all" or a specific subject string (case-insensitive)
 * @param {string} searchQuery         Raw search text (case-insensitive, trimmed)
 * @returns {Array} Filtered note list
 */
function applyFilters(notes, subjectFilter = "all", searchQuery = "") {
    let result = notes;

    // Subject filter
    if (subjectFilter && subjectFilter !== "all") {
        result = result.filter(n =>
            n.subject && n.subject.toLowerCase() === subjectFilter.toLowerCase()
        );
    }

    // Text search (title + content + subject)
    const q = searchQuery.trim().toLowerCase();
    if (q) {
        result = result.filter(n => {
            const t = n.title && n.title.toLowerCase().includes(q);
            const c = n.content && n.content.toLowerCase().includes(q);
            const s = n.subject && n.subject.toLowerCase().includes(q);
            return t || c || s;
        });
    }

    return result;
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
console.log("RUNNING SUBJECT FILTER TEST SUITE");
console.log("========================================================\n");

// Sample notes for all tests
const sampleNotes = [
    { id: "1", title: "Normalization",  subject: "DBMS",    content: "1NF 2NF 3NF",          labels: [] },
    { id: "2", title: "OS Scheduling",  subject: "OS",      content: "Round robin FCFS",       labels: [] },
    { id: "3", title: "ER Diagrams",    subject: "DBMS",    content: "Entity Relationship",    labels: [] },
    { id: "4", title: "Calculus",       subject: "Maths",   content: "Derivatives integrals",  labels: [] },
    { id: "5", title: "Memory Mgmt",   subject: "OS",      content: "Paging segmentation",    labels: [] },
    { id: "6", title: "Untitled",       subject: "",        content: "No subject note",         labels: [] },
];

// SF-01: Subject list derived correctly
runTest("SF-01", "Unique subjects extracted and sorted (excludes blank)", () => {
    const subjects = getUniqueSubjects(sampleNotes);
    assert.deepStrictEqual(subjects, ["DBMS", "Maths", "OS"]);
});

// SF-02: "All subjects" returns all notes
runTest("SF-02", "'all' subject filter returns full collection", () => {
    const result = applyFilters(sampleNotes, "all");
    assert.strictEqual(result.length, sampleNotes.length);
});

// SF-03: Filter by specific subject
runTest("SF-03", "Filtering by 'DBMS' returns only DBMS notes", () => {
    const result = applyFilters(sampleNotes, "DBMS");
    assert.strictEqual(result.length, 2);
    assert(result.every(n => n.subject === "DBMS"), "All results must be DBMS");
});

// SF-04: Filter by OS
runTest("SF-04", "Filtering by 'OS' returns only OS notes", () => {
    const result = applyFilters(sampleNotes, "OS");
    assert.strictEqual(result.length, 2);
    assert(result.every(n => n.subject === "OS"), "All results must be OS");
});

// SF-05: Subject filter is case-insensitive
runTest("SF-05", "Subject filter matches case-insensitively ('dbms' = 'DBMS')", () => {
    const result = applyFilters(sampleNotes, "dbms");
    assert.strictEqual(result.length, 2);
});

// SF-06: No notes match subject
runTest("SF-06", "Filtering by non-existent subject returns empty array", () => {
    const result = applyFilters(sampleNotes, "Chemistry");
    assert.strictEqual(result.length, 0);
});

// SF-07: Search + subject filter together (AND behaviour)
runTest("SF-07", "Search 'diagram' with subject 'DBMS' returns matching intersection", () => {
    const result = applyFilters(sampleNotes, "DBMS", "diagram");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].title, "ER Diagrams");
});

// SF-08: Search with no subject filter
runTest("SF-08", "Search 'scheduling' with 'all' subjects finds OS note", () => {
    const result = applyFilters(sampleNotes, "all", "scheduling");
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].subject, "OS");
});

// SF-09: Clearing subject filter keeps search query
runTest("SF-09", "Clearing subject filter ('all') preserves search results", () => {
    // Filter by DBMS + search "normalization"
    const filtered = applyFilters(sampleNotes, "DBMS", "normalization");
    assert.strictEqual(filtered.length, 1);

    // Now clear subject filter → should still match 'normalization' in all notes
    const cleared = applyFilters(sampleNotes, "all", "normalization");
    assert.strictEqual(cleared.length, 1, "Should find same note with 'all' filter");
    assert.strictEqual(cleared[0].title, "Normalization");
});

// SF-10: Clearing search keeps subject filter
runTest("SF-10", "Clearing search query preserves active subject filter", () => {
    // Active subject = OS, then clear search
    const result = applyFilters(sampleNotes, "OS", "");
    assert.strictEqual(result.length, 2, "Should show all OS notes with empty search");
});

// SF-11: Subject filter does not mutate original notes array
runTest("SF-11", "Subject filter never mutates the stored notes collection", () => {
    const original = sampleNotes.map(n => ({ ...n }));
    applyFilters(sampleNotes, "DBMS", "er");
    assert.strictEqual(sampleNotes.length, original.length, "Notes array length must not change");
    original.forEach((orig, i) => {
        assert.strictEqual(sampleNotes[i].id, orig.id, `Note ${i} id changed`);
    });
});

// SF-12: Search + filter that yields zero results
runTest("SF-12", "Search+filter with no match returns empty (not an error)", () => {
    const result = applyFilters(sampleNotes, "Maths", "scheduling");
    assert.strictEqual(result.length, 0);
});

console.log("\n--------------------------------------------------------");
console.log(`TEST SUMMARY: ${passed}/${total} Passed (${total - passed} Failed)`);
console.log("========================================================\n");

if (passed !== total) {
    process.exit(1);
}
