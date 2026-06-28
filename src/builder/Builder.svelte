<script lang="ts">
  import {
    type Resume,
    type TemplateId,
    TEMPLATE_IDS,
    TEMPLATE_LABELS,
    resumeSchema,
    sampleResume,
    loadResume,
    saveResume,
    emptyExperience,
    emptyEducation,
    emptySkillGroup,
  } from "./resume-schema";
  import Form from "./Form.svelte";
  import Sheet from "./Sheet.svelte";

  let resume = $state<Resume>(loadResume() ?? sampleResume());
  let template = $state<TemplateId>("classic");

  // Auto-save every change to localStorage (no accounts, no backend).
  $effect(() => {
    saveResume(resume);
  });

  function clearAll() {
    const blank = resumeSchema.parse({});
    blank.experience.push(emptyExperience());
    blank.education.push(emptyEducation());
    blank.skills.push(emptySkillGroup());
    resume = blank;
  }
</script>

<div class="builder">
  <section class="editor" data-chrome>
    <div class="toolbar">
      <div class="templates" role="group" aria-label="Template">
        {#each TEMPLATE_IDS as id}
          <button class:active={template === id} onclick={() => (template = id)}>
            {TEMPLATE_LABELS[id]}
          </button>
        {/each}
      </div>
      <div class="actions">
        <button class="ghost" onclick={() => (resume = sampleResume())}>Sample</button>
        <button class="ghost" onclick={clearAll}>Clear</button>
        <button class="primary" onclick={() => window.print()}>Download PDF</button>
      </div>
    </div>
    <Form bind:resume />
  </section>

  <section class="preview" aria-label="Preview">
    <div class="stage">
      <Sheet {resume} variant={template} />
    </div>
  </section>
</div>

<style>
  .builder {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(0, 1.1fr);
    gap: 0;
    height: calc(100vh - 48px);
  }
  .editor {
    overflow-y: auto;
    padding: 16px;
    border-right: 1px solid #e3e3e6;
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 14px;
    position: sticky;
    top: -16px;
    background: #fff;
    padding: 8px 0;
    z-index: 1;
  }
  .templates button {
    border: 1px solid #ccc;
    background: #fff;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.82rem;
  }
  .templates button.active {
    background: #111;
    color: #fff;
    border-color: #111;
  }
  .actions {
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
    .builder {
      grid-template-columns: 1fr;
      height: auto;
    }
    .preview {
      display: none;
    }
  }
</style>
