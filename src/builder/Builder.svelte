<script lang="ts">
  import {
    type Resume,
    type TemplateId,
    TEMPLATE_IDS,
    TEMPLATE_META,
    resumeSchema,
    sampleFor,
    isPristineSample,
    loadResume,
    saveResume,
    emptyExperience,
    emptyEducation,
    emptySkillGroup,
  } from "./resume-schema";
  import { type ResumeStyle, defaultStyle, loadStyle, saveStyle } from "./resume-style";
  import Form from "./Form.svelte";
  import Preview from "./Preview.svelte";
  import StyleBar from "./StyleBar.svelte";
  import ImportPanel from "./import/ImportPanel.svelte";
  import { sanitizeResume } from "./resume-core";

  // Sanitize on load too: localStorage may hold values written by a prior build, a
  // browser extension, or devtools — the render path must not trust stored content.
  let resume = $state<Resume>(sanitizeResume(loadResume() ?? sampleFor("ats-minimal")));
  let template = $state<TemplateId>("ats-minimal");
  // Typography/color knobs (separate from content); sanitized on load.
  let style = $state<ResumeStyle>(loadStyle() ?? defaultStyle());

  // Switching template while the content is still an untouched sample swaps in the
  // persona that suits that template. Once the user edits, their content is kept.
  function pickTemplate(id: TemplateId) {
    if (isPristineSample(resume)) resume = sampleFor(id);
    template = id;
  }

  // Drop a parsed/imported resume into the editor (sanitized at the boundary). Named
  // applyImport, not loadResume — the latter is the localStorage loader imported above.
  function applyImport(r: Resume) {
    resume = sanitizeResume(r);
  }

  // Auto-save every change to localStorage (no accounts, no backend); sanitize the
  // persisted copy so a manually-typed javascript:/data: URL never lands in storage.
  $effect(() => {
    saveResume(sanitizeResume(resume));
  });
  $effect(() => {
    saveStyle(style);
  });

  function clearAll() {
    const blank = resumeSchema.parse({});
    blank.experience.push(emptyExperience());
    blank.education.push(emptyEducation());
    blank.skills.push(emptySkillGroup());
    resume = blank;
  }
</script>

<div class="app">
  <header class="bar" data-chrome>
    <label class="ctl">
      <span class="lbl">Template</span>
      <select
        value={template}
        onchange={(e) => pickTemplate(e.currentTarget.value as TemplateId)}
        aria-label="Template"
      >
        {#each TEMPLATE_IDS as id}
          <option value={id}>{TEMPLATE_META[id].label}</option>
        {/each}
      </select>
    </label>

    <span class="divider" aria-hidden="true"></span>

    <StyleBar bind:style />

    <div class="actions">
      <button class="ghost" onclick={() => (resume = sampleFor(template))}>Sample</button>
      <button class="ghost" onclick={clearAll}>Clear</button>
      <button class="primary" onclick={() => window.print()}>Download PDF</button>
    </div>
  </header>

  <div class="builder">
    <section class="editor" data-chrome>
      <ImportPanel onImport={applyImport} />
      {#if !TEMPLATE_META[template].atsSafe}
        <p class="ats-note">
          Designed two-column template — looks great, but some applicant tracking systems read
          two columns out of order. For ATS-heavy applications, pick <strong>ATS Minimal</strong> or
          <strong>Executive Elegant</strong>.
        </p>
      {/if}
      <Form bind:resume />
    </section>

    <section class="preview" aria-label="Preview">
      <div class="stage">
        <Preview {resume} {template} {style} />
      </div>
    </section>
  </div>
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 48px);
  }
  .bar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 14px;
    padding: 8px 14px;
    border-bottom: 1px solid #e3e3e6;
    background: #fff;
  }
  .ctl {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lbl {
    font-size: 0.72rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  select {
    font: inherit;
    font-size: 0.82rem;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .divider {
    width: 1px;
    align-self: stretch;
    background: #e3e3e6;
    margin: 2px 0;
  }
  .actions {
    margin-left: auto;
    display: flex;
    gap: 6px;
  }
  .ghost {
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 6px;
    padding: 5px 10px;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .primary {
    border: none;
    background: #1a4fa0;
    color: #fff;
    border-radius: 6px;
    padding: 5px 14px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.82rem;
  }
  .builder {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(0, 1.1fr);
  }
  .editor {
    overflow-y: auto;
    padding: 16px;
    border-right: 1px solid #e3e3e6;
  }
  .ats-note {
    margin: 12px 0 0;
    padding: 8px 10px;
    background: #fff7e6;
    border: 1px solid #ffe1a8;
    border-radius: 6px;
    font-size: 0.76rem;
    color: #7a5b00;
    line-height: 1.4;
  }
  .preview {
    overflow: auto;
    background: #6b7280;
    display: flex;
    justify-content: center;
    padding: 24px;
  }
  .stage {
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.25);
    height: max-content;
  }
  @media (max-width: 820px) {
    .app {
      height: auto;
    }
    .builder {
      grid-template-columns: 1fr;
    }
    .preview {
      display: none;
    }
  }
</style>
