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

  const jt = $derived(resume.jobTarget);
  const jobTargetMeta = $derived(
    [jt.employmentType, jt.locations, jt.salary, jt.availability].filter(Boolean),
  );
  const hasJobTarget = $derived(Boolean(jt.title) || jobTargetMeta.length > 0);
</script>

<article class="sheet" data-sheet>
  <header class="band">
    <div class="name">{resume.basics.fullName || "Your Name"}</div>
    {#if resume.basics.headline}<div class="headline">{resume.basics.headline}</div>{/if}
    {#if contact.length}
      <div class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep">·</span>{/if}<span>{item}</span
          >{/each}
      </div>
    {/if}
  </header>

  <div class="body">
    {#each sectionOrder as key (key)}
      {#if key === "summary"}{@render summarySec()}
      {:else if key === "highlights"}{@render highlightsSec()}
      {:else if key === "jobTarget"}{@render jobTargetSec()}
      {:else if key === "experience"}{@render experienceSec()}
      {:else if key === "projects"}{@render projectsSec()}
      {:else if key === "education"}{@render educationSec()}
      {/if}
    {/each}

    {#if resume.skills.some((s) => s.category || s.items)}
      <section>
        <h2>Skills</h2>
        {#each resume.skills as g}
          {#if g.category || g.items}
            <div class="skill-row">
              {#if g.category}<span class="skill-cat">{g.category}</span>{/if}
              {#if g.items}
                <span class="chips">
                  {#each g.items
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean) as item}<span class="chip">{item}</span>{/each}
                </span>
              {/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}
  </div>
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section>
      <h2>Professional Summary</h2>
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
      {#if jt.title}<p class="primary">{jt.title}</p>{/if}
      {#if jobTargetMeta.length}<p class="meta">{jobTargetMeta.join(" · ")}</p>{/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section>
      <h2>Work Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="row">
              <span class="primary">{exp.title}{#if exp.company}<span class="company">
                    , {exp.company}</span
                  >{/if}</span>
              {#if exp.start || exp.end}<span class="dates"
                  >{exp.start}{#if exp.end} – {exp.end}{/if}</span
                >{/if}
            </div>
            {#if exp.location}<div class="meta">{exp.location}</div>{/if}
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
                >{proj.name}{#if proj.role}<span class="company">, {proj.role}</span>{/if}</span
              >
              {#if proj.start || proj.end}<span class="dates"
                  >{proj.start}{#if proj.end} – {proj.end}{/if}</span
                >{/if}
            </div>
            {#if proj.link}<div class="meta">{proj.link}</div>{/if}
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
                    class="company"> — {ed.school}</span
                  >{:else}{ed.school}{/if}</span>
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
  .sheet {
    --ink: #1a1a1a;
    --muted: #5a5a5a;
    --accent: var(--rb-accent, #0f766e);
    --rule: var(--accent);
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Inter", "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10.3pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 0 0 16mm;
  }

  /* ---------- Full-width accent header band ---------- */
  .band {
    box-sizing: border-box;
    background: var(--accent);
    color: #fff;
    padding: 16mm 18mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .name {
    font-size: calc(24pt * var(--rb-scale, 1));
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: 0.5px;
    color: #fff;
  }
  .headline {
    margin-top: 7px;
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 2.6px;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.85);
  }
  .contact {
    margin-top: 11px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: rgba(255, 255, 255, 0.8);
  }
  .contact .sep {
    margin: 0 7px;
    color: rgba(255, 255, 255, 0.5);
  }

  /* ---------- Body (side margins) ---------- */
  .body {
    box-sizing: border-box;
    padding: 10mm 18mm 0;
  }
  section {
    margin-top: 15px;
  }
  .body > section:first-child {
    margin-top: 2px;
  }
  h2 {
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 9px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid var(--rule);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  p {
    margin: 0 0 4px;
  }
  .entry {
    margin-bottom: 11px;
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
    font-weight: 400;
    color: var(--muted);
  }
  .dates {
    color: var(--muted);
    font-size: calc(9pt * var(--rb-scale, 1));
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: calc(9pt * var(--rb-scale, 1));
    font-style: italic;
  }
  .details {
    margin-top: 3px;
  }
  ul {
    margin: 5px 0 0;
    padding-left: 17px;
  }
  li {
    margin: 2px 0;
  }
  li::marker {
    color: var(--accent);
  }

  /* ---------- Skills (chips) ---------- */
  .skill-row {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 6px 8px;
    margin: 5px 0;
  }
  .skill-cat {
    font-weight: 700;
    color: var(--ink);
  }
  .chips {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    display: inline-block;
    font-size: calc(9pt * var(--rb-scale, 1));
    line-height: 1.3;
    color: var(--accent);
    border: 1px solid var(--accent);
    border-radius: 4px;
    padding: 1.5px 8px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>
