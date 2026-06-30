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
  <header>
    <h1 class="name">{resume.basics.fullName || "Your Name"}</h1>
    {#if resume.basics.headline}<p class="headline">{resume.basics.headline}</p>{/if}
    {#if contact.length}
      <div class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep">·</span>{/if}<span>{item}</span
          >{/each}
      </div>
    {/if}
  </header>

  <!-- Functional format: lead with competencies (skills-first), then a condensed
       history. Built for career changers and skills-forward candidates. -->
  {#if skillGroups.length}
    <section class="comp">
      <h2>Core Competencies</h2>
      <div class="comp-grid">
        {#each skillGroups as g}
          <div class="comp-item">
            {#if g.category}<p class="comp-cat">{g.category}</p>{/if}
            {#if g.items}
              <ul class="comp-list">
                {#each g.items
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as item}
                  <li>{item}</li>
                {/each}
              </ul>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}

  {#each sectionOrder as key (key)}
    {#if key === "summary"}{@render summarySec()}
    {:else if key === "highlights"}{@render highlightsSec()}
    {:else if key === "jobTarget"}{@render jobTargetSec()}
    {:else if key === "experience"}{@render experienceSec()}
    {:else if key === "projects"}{@render projectsSec()}
    {:else if key === "education"}{@render educationSec()}
    {/if}
  {/each}
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section>
      <h2>Profile</h2>
      <p>{resume.summary}</p>
    </section>
  {/if}
{/snippet}

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section>
      <h2>Key Achievements</h2>
      <ul class="bul">
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section>
      <h2>Job Target</h2>
      {#if jt.title}<p class="primary">{jt.title}</p>{/if}
      {#if jobTargetMeta.length}<p class="meta">{jobTargetMeta.join(" · ")}</p>{/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section>
      <h2>Work History</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="row">
              <span class="primary"
                >{exp.title}{#if exp.company}<span class="company"> · {exp.company}</span>{/if}</span
              >
              {#if exp.start || exp.end}<span class="dates"
                  >{exp.start}{#if exp.end} – {exp.end}{/if}</span
                >{/if}
            </div>
            {#if exp.location}<div class="meta">{exp.location}</div>{/if}
            {#if exp.bullets.some(Boolean)}
              <ul class="bul">
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
                >{proj.name}{#if proj.role}<span class="company"> · {proj.role}</span>{/if}</span
              >
              {#if proj.start || proj.end}<span class="dates"
                  >{proj.start}{#if proj.end} – {proj.end}{/if}</span
                >{/if}
            </div>
            {#if proj.link}<div class="meta">{proj.link}</div>{/if}
            {#if proj.bullets.some(Boolean)}
              <ul class="bul">
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
                  >{:else}{ed.school}{/if}</span
              >
              {#if ed.graduation}<span class="dates">{ed.graduation}</span>{/if}
            </div>
            {#if ed.location}<div class="meta">{ed.location}</div>{/if}
            {#if ed.details}<p class="details">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

<style>
  /* Functional — skills-first format for career changers. A boxed Core
     Competencies grid leads; the dated work history follows, condensed. */
  .sheet {
    --accent: var(--rb-accent, #15803d);
    --tint: color-mix(in srgb, var(--accent) 7%, #fff);
    --ink: #20242b;
    --muted: #5f6670;
    --line: #e3e6e8;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10.2pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 17mm 17mm 15mm;
  }
  header {
    border-bottom: 2px solid var(--accent);
    padding-bottom: 5mm;
    margin-bottom: 7mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .name {
    margin: 0;
    font-size: calc(24pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 0.5px;
    color: #181c22;
  }
  .headline {
    margin: 4px 0 0;
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .contact {
    margin-top: 7px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 6px;
    color: var(--accent);
  }
  section {
    margin-bottom: 7mm;
  }
  section:last-child {
    margin-bottom: 0;
  }
  h2 {
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 4mm;
    padding-bottom: 2.4mm;
    border-bottom: 1px solid var(--line);
  }
  /* Core Competencies — the hero block. */
  .comp {
    background: var(--tint);
    border: 1px solid color-mix(in srgb, var(--accent) 22%, #fff);
    border-radius: 3px;
    padding: 6mm 7mm 5mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .comp h2 {
    border-bottom: none;
    padding-bottom: 0;
    margin-bottom: 3mm;
  }
  .comp-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4mm 9mm;
  }
  .comp-cat {
    margin: 0 0 1.5mm;
    font-size: calc(9.6pt * var(--rb-scale, 1));
    font-weight: 700;
    color: #232830;
  }
  .comp-list {
    margin: 0;
    padding-left: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 1.4mm 2mm;
  }
  .comp-list li {
    font-size: calc(8.8pt * var(--rb-scale, 1));
    color: #2f3640;
    background: #fff;
    border: 1px solid color-mix(in srgb, var(--accent) 28%, #e3e6e8);
    border-radius: 999px;
    padding: 1px 8px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  p {
    margin: 0 0 4px;
  }
  .entry {
    margin-bottom: 5mm;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .primary {
    font-weight: 700;
  }
  .company {
    font-weight: 500;
    color: var(--muted);
  }
  .dates {
    color: var(--muted);
    font-size: calc(8.8pt * var(--rb-scale, 1));
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: calc(8.8pt * var(--rb-scale, 1));
    font-style: italic;
  }
  .bul {
    margin: 3px 0 0;
    padding-left: 17px;
  }
  .bul li {
    margin: 2px 0;
  }
  .details {
    margin-top: 2px;
    color: #3a4048;
  }
</style>
