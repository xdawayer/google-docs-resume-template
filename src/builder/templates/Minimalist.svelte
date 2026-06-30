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
    <h1 class="name">{resume.basics.fullName || "Your Name"}</h1>
    <span class="rule" aria-hidden="true"></span>
    {#if resume.basics.headline}<p class="headline">{resume.basics.headline}</p>{/if}
    {#if contact.length}
      <div class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep">/</span>{/if}<span>{item}</span
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

  {#if resume.skills.some((s) => s.category || s.items)}
    <section>
      <h2>Skills</h2>
      {#each resume.skills as g}
        {#if g.category || g.items}
          <p class="skill"
            >{#if g.category}<span class="cat">{g.category}</span>{/if}{g.items}</p
          >
        {/if}
      {/each}
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
      {#if jt.title}<p class="primary">{jt.title}</p>{/if}
      {#if jobTargetMeta.length}<p class="meta">{jobTargetMeta.join(" · ")}</p>{/if}
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
                >{exp.title}{#if exp.company}<span class="company"> · {exp.company}</span>{/if}</span
              >
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
                >{proj.name}{#if proj.role}<span class="company"> · {proj.role}</span>{/if}</span
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
  /* Minimalist — restraint as the design: left-aligned, lots of whitespace,
     hairline rules, a single short accent stroke under the name. No shouting. */
  .sheet {
    --accent: var(--rb-accent, #111827);
    --ink: #1c1c1c;
    --muted: #76787d;
    --line: #e6e6e8;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10.2pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 24mm 22mm;
  }
  header {
    margin-bottom: 11mm;
  }
  .name {
    margin: 0;
    font-size: calc(26pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 1px;
    color: #16181d;
  }
  .rule {
    display: block;
    width: 38mm;
    height: 2px;
    margin: 5mm 0 4mm;
    background: var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .headline {
    margin: 0;
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 500;
    color: var(--muted);
  }
  .contact {
    margin-top: 6px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 7px;
    color: #c2c4c8;
  }
  section {
    margin-bottom: 9mm;
  }
  section:last-child {
    margin-bottom: 0;
  }
  h2 {
    font-size: calc(8.6pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--muted);
    margin: 0 0 4mm;
    padding-bottom: 2.4mm;
    border-bottom: 1px solid var(--line);
  }
  p {
    margin: 0 0 4px;
  }
  .entry {
    margin-bottom: 6mm;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px;
  }
  .primary {
    font-weight: 600;
    color: #1c1c1c;
  }
  .company {
    font-weight: 400;
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
    margin-top: 1px;
  }
  ul {
    margin: 3.5mm 0 0;
    padding-left: 16px;
    list-style: none;
  }
  li {
    position: relative;
    margin: 0 0 1.8mm;
    padding-left: 2px;
  }
  li::before {
    content: "–";
    position: absolute;
    left: -14px;
    color: var(--muted);
  }
  .skill {
    margin: 3px 0;
  }
  .skill .cat {
    font-weight: 600;
    color: #2a2c30;
  }
  .skill .cat::after {
    content: " — ";
    color: var(--muted);
  }
  .details {
    margin-top: 2px;
    color: #44464c;
  }
</style>
