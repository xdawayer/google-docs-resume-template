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
  <header>
    <div class="name">{resume.basics.fullName || "Your Name"}</div>
    {#if resume.basics.headline}<div class="headline">{resume.basics.headline}</div>{/if}
    {#if contact.length}
      <div class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep">·</span>{/if}<span>{item}</span
          >{/each}
      </div>
    {/if}
    <div class="accent-rule" aria-hidden="true"></div>
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

  {#if resume.skills.some((s) => s.category || s.items)}
    <section>
      <h2>Skills</h2>
      {#each resume.skills as g}
        {#if g.category || g.items}
          <div class="skill-group">
            {#if g.category}<div class="skill-label">{g.category}</div>{/if}
            {#if g.items}
              <div class="chips">
                {#each g.items
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean) as item}
                  <span class="chip">{item}</span>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
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
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Inter", "Segoe UI", "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10pt * var(--rb-scale, 1));
    line-height: calc(1.4 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 18mm 18mm 16mm;
  }

  /* Header — left aligned, name in normal case, accent headline + short rule */
  header {
    text-align: left;
    margin-bottom: 16px;
  }
  .name {
    font-size: calc(22pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: -0.2px;
    color: var(--ink);
  }
  .headline {
    margin-top: 4px;
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--rb-accent, #2563eb);
  }
  .contact {
    margin-top: 7px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 7px;
    color: #b0b0b0;
  }
  .accent-rule {
    margin-top: 11px;
    width: 46px;
    height: 2px;
    background: var(--rb-accent, #2563eb);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Sections — accent uppercase headings with a short accent underline */
  section {
    margin-top: 15px;
  }
  h2 {
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--rb-accent, #2563eb);
    margin: 0 0 9px;
  }
  h2::after {
    content: "";
    display: block;
    width: 34px;
    height: 2px;
    margin-top: 4px;
    background: var(--rb-accent, #2563eb);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  p {
    margin: 0 0 4px;
  }

  /* Entries — engineer-clean, tight, left aligned */
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
    font-variant-numeric: tabular-nums;
  }
  .meta {
    color: var(--muted);
    font-size: calc(9pt * var(--rb-scale, 1));
  }
  ul {
    margin: 4px 0 0;
    padding-left: 16px;
  }
  li {
    margin: 2px 0;
  }

  /* Skills — signature: bordered accent-tinted chips grouped under labels */
  .skill-group {
    margin-bottom: 9px;
  }
  .skill-group:last-child {
    margin-bottom: 0;
  }
  .skill-label {
    font-size: calc(8.5pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 4px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
  .chip {
    display: inline-block;
    padding: 2px 8px;
    font-size: calc(8.4pt * var(--rb-scale, 1));
    line-height: 1.5;
    white-space: nowrap;
    border: 1px solid color-mix(in srgb, var(--rb-accent, #2563eb) 38%, #ffffff);
    background: color-mix(in srgb, var(--rb-accent, #2563eb) 7%, #ffffff);
    color: color-mix(in srgb, var(--rb-accent, #2563eb) 78%, #1a1a1a);
    border-radius: 4px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>
