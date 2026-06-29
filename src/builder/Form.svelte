<script lang="ts">
  import {
    type Resume,
    type Experience,
    type Project,
    emptyExperience,
    emptyEducation,
    emptySkillGroup,
    emptyProject,
  } from "./resume-schema";
  import {
    type SectionKey,
    SECTION_LABELS,
    moveSection,
    defaultOrder,
  } from "./section-order";

  let {
    resume = $bindable(),
    sectionOrder = $bindable(),
  }: { resume: Resume; sectionOrder: SectionKey[] } = $props();

  // Collapse is editor-only UI state (preview always shows non-empty sections).
  let collapsed = $state<Record<string, boolean>>({});
  const toggle = (key: string) => (collapsed[key] = !collapsed[key]);
  const move = (key: SectionKey, dir: -1 | 1) => (sectionOrder = moveSection(sectionOrder, key, dir));

  const order = $derived(sectionOrder?.length ? sectionOrder : defaultOrder());

  const addLink = () => resume.basics.links.push({ label: "", url: "" });
  const removeLink = (i: number) => resume.basics.links.splice(i, 1);

  const addHighlight = () => resume.highlights.push("");
  const removeHighlight = (i: number) => resume.highlights.splice(i, 1);

  const addExperience = () => resume.experience.push(emptyExperience());
  const removeExperience = (i: number) => resume.experience.splice(i, 1);
  const addBullet = (exp: Experience) => exp.bullets.push("");
  const removeBullet = (exp: Experience, j: number) => exp.bullets.splice(j, 1);

  const addProject = () => resume.projects.push(emptyProject());
  const removeProject = (i: number) => resume.projects.splice(i, 1);
  const addProjectBullet = (p: Project) => p.bullets.push("");
  const removeProjectBullet = (p: Project, j: number) => p.bullets.splice(j, 1);

  const addEducation = () => resume.education.push(emptyEducation());
  const removeEducation = (i: number) => resume.education.splice(i, 1);

  const addSkill = () => resume.skills.push(emptySkillGroup());
  const removeSkill = (i: number) => resume.skills.splice(i, 1);

  const EMPLOYMENT_TYPES = ["", "Full-time", "Part-time", "Contract", "Internship", "Freelance"];
</script>

<!-- A collapsible panel; `key` orderable panels also get up/down move controls. -->
{#snippet panel(key: string, label: string, body: () => unknown, pos: number, count: number)}
  <section class="panel">
    <div class="phead">
      <button
        type="button"
        class="ptoggle"
        aria-expanded={!collapsed[key]}
        onclick={() => toggle(key)}
      >
        <span class="chev" class:open={!collapsed[key]} aria-hidden="true">▸</span>
        <span class="ptitle">{label}</span>
      </button>
      {#if pos >= 0}
        <span class="pmove">
          <button
            type="button"
            onclick={() => move(key as SectionKey, -1)}
            disabled={pos === 0}
            aria-label={`Move ${label} up`}>↑</button
          >
          <button
            type="button"
            onclick={() => move(key as SectionKey, 1)}
            disabled={pos === count - 1}
            aria-label={`Move ${label} down`}>↓</button
          >
        </span>
      {/if}
    </div>
    {#if !collapsed[key]}
      <div class="pbody">{@render body()}</div>
    {/if}
  </section>
{/snippet}

<form class="form" onsubmit={(e) => e.preventDefault()}>
  {@render panel("basics", "Personal Info", basicsBody, -1, 0)}

  {#each order as key, i (key)}
    {#if key === "summary"}{@render panel(key, SECTION_LABELS[key], summaryBody, i, order.length)}
    {:else if key === "highlights"}{@render panel(
        key,
        SECTION_LABELS[key],
        highlightsBody,
        i,
        order.length,
      )}
    {:else if key === "jobTarget"}{@render panel(
        key,
        SECTION_LABELS[key],
        jobTargetBody,
        i,
        order.length,
      )}
    {:else if key === "experience"}{@render panel(
        key,
        SECTION_LABELS[key],
        experienceBody,
        i,
        order.length,
      )}
    {:else if key === "projects"}{@render panel(
        key,
        SECTION_LABELS[key],
        projectsBody,
        i,
        order.length,
      )}
    {:else if key === "education"}{@render panel(
        key,
        SECTION_LABELS[key],
        educationBody,
        i,
        order.length,
      )}
    {/if}
  {/each}

  {@render panel("skills", "Skills", skillsBody, -1, 0)}
</form>

{#snippet basicsBody()}
  <label>Full name<input bind:value={resume.basics.fullName} placeholder="Your Name" /></label>
  <label>Headline / target role<input bind:value={resume.basics.headline} placeholder="Senior Software Engineer" /></label>
  <div class="grid">
    <label>Email<input bind:value={resume.basics.email} type="email" /></label>
    <label>Phone<input bind:value={resume.basics.phone} /></label>
  </div>
  <label>Location<input bind:value={resume.basics.location} placeholder="City, State" /></label>
  <label
    >Photo URL (optional)<input
      bind:value={resume.basics.photo}
      placeholder="https://…  — used by the Creative template"
    /></label
  >
  <div class="rows">
    {#each resume.basics.links as link, i}
      <div class="row">
        <input bind:value={link.label} placeholder="LinkedIn" class="w-30" />
        <input bind:value={link.url} placeholder="linkedin.com/in/you" />
        <button type="button" class="del" onclick={() => removeLink(i)} aria-label="Remove link">×</button>
      </div>
    {/each}
    <button type="button" class="add" onclick={addLink}>+ Add link</button>
  </div>
{/snippet}

{#snippet summaryBody()}
  <textarea bind:value={resume.summary} rows="3" placeholder="One or two lines on your target role and strongest result."></textarea>
{/snippet}

{#snippet highlightsBody()}
  <span class="sub">Short, punchy strengths — one per line.</span>
  <div class="rows">
    {#each resume.highlights as _, i}
      <div class="row">
        <input bind:value={resume.highlights[i]} placeholder="Led the rebrand that lifted recall 31%." />
        <button type="button" class="del" onclick={() => removeHighlight(i)} aria-label="Remove highlight">×</button>
      </div>
    {/each}
    <button type="button" class="add" onclick={addHighlight}>+ Add highlight</button>
  </div>
{/snippet}

{#snippet jobTargetBody()}
  <label>Target role<input bind:value={resume.jobTarget.title} placeholder="Senior Product Manager" /></label>
  <div class="grid">
    <label
      >Employment type<select bind:value={resume.jobTarget.employmentType}>
        {#each EMPLOYMENT_TYPES as t}
          <option value={t}>{t || "—"}</option>
        {/each}
      </select></label
    >
    <label>Locations<input bind:value={resume.jobTarget.locations} placeholder="Austin, TX · Remote" /></label>
  </div>
  <div class="grid">
    <label>Expected pay (optional)<input bind:value={resume.jobTarget.salary} placeholder="$120k–$150k" /></label>
    <label>Availability<input bind:value={resume.jobTarget.availability} placeholder="Available immediately" /></label>
  </div>
{/snippet}

{#snippet experienceBody()}
  {#each resume.experience as exp, i}
    <div class="item">
      <div class="grid">
        <label>Title<input bind:value={exp.title} /></label>
        <label>Company<input bind:value={exp.company} /></label>
      </div>
      <div class="grid">
        <label>Location<input bind:value={exp.location} /></label>
        <div class="grid">
          <label>Start<input bind:value={exp.start} placeholder="2022" /></label>
          <label>End<input bind:value={exp.end} placeholder="Present" /></label>
        </div>
      </div>
      <div class="bullets">
        <span class="sub">Bullets</span>
        {#each exp.bullets as _, j}
          <div class="row">
            <input bind:value={exp.bullets[j]} placeholder="Lead with a measurable outcome." />
            <button type="button" class="del" onclick={() => removeBullet(exp, j)} aria-label="Remove bullet">×</button>
          </div>
        {/each}
        <button type="button" class="add" onclick={() => addBullet(exp)}>+ Add bullet</button>
      </div>
      <button type="button" class="remove" onclick={() => removeExperience(i)}>Remove role</button>
    </div>
  {/each}
  <button type="button" class="add" onclick={addExperience}>+ Add role</button>
{/snippet}

{#snippet projectsBody()}
  {#each resume.projects as proj, i}
    <div class="item">
      <div class="grid">
        <label>Project<input bind:value={proj.name} placeholder="Read-through cache layer" /></label>
        <label>Your role<input bind:value={proj.role} placeholder="Tech Lead" /></label>
      </div>
      <div class="grid">
        <label>Link (optional)<input bind:value={proj.link} placeholder="github.com/you/project" /></label>
        <div class="grid">
          <label>Start<input bind:value={proj.start} placeholder="2023" /></label>
          <label>End<input bind:value={proj.end} placeholder="2024" /></label>
        </div>
      </div>
      <div class="bullets">
        <span class="sub">Bullets</span>
        {#each proj.bullets as _, j}
          <div class="row">
            <input bind:value={proj.bullets[j]} placeholder="What it did and the result." />
            <button type="button" class="del" onclick={() => removeProjectBullet(proj, j)} aria-label="Remove bullet">×</button>
          </div>
        {/each}
        <button type="button" class="add" onclick={() => addProjectBullet(proj)}>+ Add bullet</button>
      </div>
      <button type="button" class="remove" onclick={() => removeProject(i)}>Remove project</button>
    </div>
  {/each}
  <button type="button" class="add" onclick={addProject}>+ Add project</button>
{/snippet}

{#snippet educationBody()}
  {#each resume.education as ed, i}
    <div class="item">
      <div class="grid">
        <label>School<input bind:value={ed.school} /></label>
        <label>Graduation<input bind:value={ed.graduation} placeholder="2019" /></label>
      </div>
      <div class="grid">
        <label>Degree<input bind:value={ed.degree} placeholder="B.S." /></label>
        <label>Field<input bind:value={ed.field} placeholder="Computer Science" /></label>
      </div>
      <label>Location<input bind:value={ed.location} /></label>
      <button type="button" class="remove" onclick={() => removeEducation(i)}>Remove</button>
    </div>
  {/each}
  <button type="button" class="add" onclick={addEducation}>+ Add education</button>
{/snippet}

{#snippet skillsBody()}
  {#each resume.skills as group, i}
    <div class="row">
      <input bind:value={group.category} placeholder="Languages" class="w-30" />
      <input bind:value={group.items} placeholder="TypeScript, Go, SQL" />
      <button type="button" class="del" onclick={() => removeSkill(i)} aria-label="Remove skill group">×</button>
    </div>
  {/each}
  <button type="button" class="add" onclick={addSkill}>+ Add skill group</button>
{/snippet}

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .panel {
    border: 1px solid #e3e3e6;
    border-radius: 8px;
    overflow: hidden;
  }
  .phead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 8px 0 4px;
    background: #fafafa;
  }
  .ptoggle {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    padding: 10px 6px;
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    text-align: left;
    color: #1a1a1a;
  }
  .chev {
    display: inline-block;
    transition: transform 0.12s ease;
    color: #888;
    font-size: 0.8rem;
  }
  .chev.open {
    transform: rotate(90deg);
  }
  .pmove {
    display: flex;
    gap: 4px;
    flex: none;
  }
  .pmove button {
    width: 24px;
    height: 24px;
    border: 1px solid #d0d0d3;
    background: #fff;
    border-radius: 5px;
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1;
    padding: 0;
    color: #444;
  }
  .pmove button:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
  .pbody {
    padding: 12px 14px;
    border-top: 1px solid #eee;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: #444;
    gap: 3px;
    margin-bottom: 8px;
  }
  input,
  textarea,
  select {
    font: inherit;
    font-size: 0.9rem;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .rows,
  .bullets {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .w-30 {
    max-width: 30%;
  }
  .item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }
  .sub {
    font-size: 0.75rem;
    color: #666;
  }
  .add {
    align-self: flex-start;
    background: none;
    border: 1px dashed #aaa;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .remove {
    background: none;
    border: none;
    color: #b00020;
    cursor: pointer;
    font-size: 0.78rem;
    padding: 4px 0 0;
  }
  .del {
    background: none;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    flex: none;
  }
</style>
