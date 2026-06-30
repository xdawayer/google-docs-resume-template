<script lang="ts">
  import type { Resume } from "../resume-schema";
  import { type SectionKey, defaultOrder } from "../section-order";
  let { resume, sectionOrder = defaultOrder() }: { resume: Resume; sectionOrder?: SectionKey[] } =
    $props();

  const contact = $derived(
    [
      resume.basics.location,
      resume.basics.email,
      resume.basics.phone,
      ...resume.basics.links.map((l) => l.url).filter(Boolean),
    ].filter(Boolean),
  );

  const skillGroups = $derived(resume.skills.filter((s) => s.category || s.items));

  const jt = $derived(resume.jobTarget);
  const jobTargetMeta = $derived(
    [jt.employmentType, jt.locations, jt.salary, jt.availability].filter(Boolean),
  );
  const hasJobTarget = $derived(Boolean(jt.title) || jobTargetMeta.length > 0);
</script>

<article class="sheet" data-sheet>
  <span class="topbar" aria-hidden="true"></span>
  <header>
    <div class="id">
      <h1 class="name">{resume.basics.fullName || "Your Name"}</h1>
      {#if resume.basics.headline}<span class="headline">{resume.basics.headline}</span>{/if}
    </div>
    {#if contact.length}
      <div class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep">·</span>{/if}<span>{item}</span
          >{/each}
      </div>
    {/if}
  </header>

  {#each sectionOrder as key (key)}
    {#if key === "summary"}{@render summarySec()}
    {:else if key === "highlights"}{@render highlightsSec()}
    {:else if key === "jobTarget"}{@render jobTargetSec()}
    {:else if key === "experience"}{@render experienceSec()}
    {:else if key === "projects"}{@render projectsSec()}
    {:else if key === "education"}{@render educationSec()}
    {/if}
  {/each}

  {#if skillGroups.length}
    <section>
      <h2>Skills</h2>
      <div class="skill-grid">
        {#each skillGroups as g}
          <p class="skill"
            >{#if g.category}<span class="cat">{g.category}:</span> {/if}{g.items}</p
          >
        {/each}
      </div>
    </section>
  {/if}
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section>
      <h2>Summary</h2>
      <p>{resume.summary}</p>
    </section>
  {/if}
{/snippet}

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section>
      <h2>Highlights</h2>
      <ul>
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section>
      <h2>Job Target</h2>
      {#if jt.title}<span class="primary">{jt.title}</span>{/if}
      {#if jobTargetMeta.length}<span class="meta"
          >{#if jt.title} · {/if}{jobTargetMeta.join(" · ")}</span
        >{/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section>
      <h2>Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="row">
              <span class="primary"
                >{exp.title}{#if exp.company}<span class="company"> · {exp.company}</span>{/if}{#if exp.location}<span
                    class="loc"> · {exp.location}</span
                  >{/if}</span
              >
              {#if exp.start || exp.end}<span class="dates"
                  >{exp.start}{#if exp.end} – {exp.end}{/if}</span
                >{/if}
            </div>
            {#if exp.bullets.some(Boolean)}
              <ul>
                {#each exp.bullets.filter(Boolean) as b}<li>{b}</li>{/each}
              </ul>
            {/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

{#snippet projectsSec()}
  {#if resume.projects.some((p) => p.name || p.role)}
    <section>
      <h2>Projects</h2>
      {#each resume.projects as proj}
        {#if proj.name || proj.role}
          <div class="entry">
            <div class="row">
              <span class="primary"
                >{proj.name}{#if proj.role}<span class="company"> · {proj.role}</span>{/if}{#if proj.link}<span
                    class="loc"> · {proj.link}</span
                  >{/if}</span
              >
              {#if proj.start || proj.end}<span class="dates"
                  >{proj.start}{#if proj.end} – {proj.end}{/if}</span
                >{/if}
            </div>
            {#if proj.bullets.some(Boolean)}
              <ul>
                {#each proj.bullets.filter(Boolean) as b}<li>{b}</li>{/each}
              </ul>
            {/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

{#snippet educationSec()}
  {#if resume.education.some((e) => e.school)}
    <section>
      <h2>Education</h2>
      {#each resume.education as ed}
        {#if ed.school}
          <div class="entry">
            <div class="row">
              <span class="primary"
                >{ed.degree}{#if ed.field}, {ed.field}{/if}{#if ed.degree || ed.field}<span
                    class="company"> · {ed.school}</span
                  >{:else}{ed.school}{/if}{#if ed.location}<span class="loc"> · {ed.location}</span
                  >{/if}</span
              >
              {#if ed.graduation}<span class="dates">{ed.graduation}</span>{/if}
            </div>
            {#if ed.details}<p class="details">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

<style>
  /* Compact — a dense, efficient one-pager for experienced candidates: tight
     spacing, a thin accent top bar, two-column skills. Stays single-column and
     ATS-readable. */
  .sheet {
    --accent: var(--rb-accent, #334155);
    --ink: #1d2127;
    --muted: #5e646e;
    --line: #e1e3e7;
    position: relative;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(9.8pt * var(--rb-scale, 1));
    line-height: calc(1.38 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 14mm 15mm 13mm;
  }
  .topbar {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4mm;
    background: var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 14px;
    padding-bottom: 3.5mm;
    margin-bottom: 4.5mm;
    border-bottom: 1.5px solid var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .id {
    min-width: 0;
  }
  .name {
    margin: 0;
    font-size: calc(21pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 0.3px;
    line-height: 1.05;
    color: #16191f;
  }
  .headline {
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 0.6px;
    color: var(--accent);
  }
  .contact {
    flex: 0 0 auto;
    text-align: right;
    font-size: calc(8.4pt * var(--rb-scale, 1));
    color: var(--muted);
    max-width: 70mm;
  }
  .contact .sep {
    margin: 0 4px;
    color: #b9bdc4;
  }
  section {
    margin-bottom: 4.5mm;
  }
  section:last-child {
    margin-bottom: 0;
  }
  h2 {
    font-size: calc(9.4pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 2.6mm;
    padding-bottom: 1.4mm;
    border-bottom: 1px solid var(--line);
  }
  p {
    margin: 0 0 3px;
  }
  .entry {
    margin-bottom: 3mm;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .primary {
    font-weight: 700;
    color: var(--ink);
  }
  .company {
    font-weight: 500;
    color: #353b44;
  }
  .loc {
    font-weight: 400;
    color: var(--muted);
    font-style: italic;
  }
  .dates {
    flex: 0 0 auto;
    color: var(--muted);
    font-size: calc(8.4pt * var(--rb-scale, 1));
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: calc(8.6pt * var(--rb-scale, 1));
  }
  ul {
    margin: 1.6mm 0 0;
    padding-left: 15px;
  }
  li {
    margin: 1.2mm 0;
  }
  .skill-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1mm 8mm;
  }
  .skill {
    margin: 0;
    font-size: calc(9.2pt * var(--rb-scale, 1));
  }
  .skill .cat {
    font-weight: 700;
    color: #2a3038;
  }
  .details {
    margin-top: 1px;
    color: #3a4048;
    font-size: calc(9pt * var(--rb-scale, 1));
  }
</style>
