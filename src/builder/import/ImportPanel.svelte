<script lang="ts">
  import { extractText, ACCEPTED } from "./extract";
  import { HeuristicParser } from "./heuristic-parser";
  import { sanitizeResume, type Resume } from "../resume-core";

  let { onImport }: { onImport: (r: Resume) => void } = $props();
  let busy = $state(false);
  let error = $state("");
  let warnings = $state<string[]>([]);
  let lowCount = $state(0);
  let pasted = $state("");
  const parser = new HeuristicParser();

  async function run(input: File | string) {
    busy = true;
    error = "";
    warnings = [];
    lowCount = 0;
    try {
      const extracted = await extractText(input);
      const { resume, confidence, warnings: w } = await parser.parse(extracted);
      warnings = w;
      lowCount = Object.values(confidence).filter((c) => c < 0.6).length;
      onImport(sanitizeResume(resume)); // sanitize before it touches builder state
    } catch (e) {
      error = (e as Error).message || "Could not read that file. Try paste or another format.";
    } finally {
      busy = false;
    }
  }

  function onFile(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) run(f);
  }
</script>

<details class="import" data-import>
  <summary>Import an existing resume</summary>
  <p class="hint">
    Upload a .docx or .pdf, or paste text. Parsed in your browser — nothing is uploaded. English
    resumes work best; check the highlighted fields after import.
  </p>
  <label class="file">
    <input
      type="file"
      accept={ACCEPTED.join(",")}
      onchange={onFile}
      disabled={busy}
      data-import-file
    />
    Choose file
  </label>
  <textarea
    bind:value={pasted}
    rows="4"
    placeholder="…or paste resume text here"
    disabled={busy}
  ></textarea>
  <button onclick={() => run(pasted)} disabled={busy || !pasted.trim()} data-import-paste>
    Parse pasted text
  </button>
  {#if busy}<p class="hint">Reading…</p>{/if}
  {#if error}<p class="err" data-import-error>{error}</p>{/if}
  {#if lowCount > 0}
    <p class="warn" data-import-lowconf>
      Imported — please double-check {lowCount} field{lowCount > 1 ? "s" : ""} we were unsure about.
    </p>
  {/if}
  {#if warnings.length}
    <ul class="warn">
      {#each warnings as w}<li>{w}</li>{/each}
    </ul>
  {/if}
</details>

<style>
  .import {
    border: 1px solid #e3e3e6;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 14px;
  }
  .import summary {
    cursor: pointer;
    font-weight: 600;
  }
  .hint {
    font-size: 0.78rem;
    color: #555;
    margin: 8px 0;
  }
  .file {
    display: inline-block;
    border: 1px solid #ccc;
    border-radius: 6px;
    padding: 6px 10px;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .file input {
    display: none;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    font: inherit;
    margin-top: 8px;
  }
  button {
    margin-top: 8px;
    border: none;
    background: #6366f1;
    color: #fff;
    border-radius: 6px;
    padding: 6px 12px;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  .err {
    color: #b00020;
    font-size: 0.82rem;
  }
  .warn {
    font-size: 0.76rem;
    color: #7a5b00;
  }
</style>
