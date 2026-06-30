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
      <h2>Skills &amp; Certifications</h2>
      {#each resume.skills as g}
        {#if g.category || g.items}
          <p class="skill"
            >{#if g.category}<strong>{g.category}:</strong> {/if}{g.items}</p
          >
        {/if}
      {/each}
    </section>
  {/if}
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
      <h2>Objective</h2>
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
                >{exp.title}{#if exp.company}<span class="company">, {exp.company}</span>{/if}</span
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
  /* Academic — scholarly serif resume. Signature: LEFT-aligned serif masthead with
     small-caps section headings over hairline rules (distinct from the CENTERED
     Executive Elegant). Single column, scanner-first. */
  .sheet {
    --ink: #20242b;
    --muted: #5c616b;
    --accent: var(--rb-accent, #3f3f46);
    --hair: #c9ccd2;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, Georgia, "Times New Roman", Times, serif);
    font-size: calc(10.6pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 19mm 19mm 16mm;
  }
  header {
    margin-bottom: 16px;
    padding-bottom: 9px;
    border-bottom: 1px solid var(--accent);
  }
  .name {
    font-size: calc(25pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 0.5px;
    line-height: 1.1;
    color: var(--ink);
  }
  .headline {
    margin-top: 5px;
    font-size: calc(11.5pt * var(--rb-scale, 1));
    font-style: italic;
    color: var(--muted);
  }
  .contact {
    margin-top: 7px;
    font-size: calc(9.3pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 7px;
    color: #b3b7bd;
  }
  section {
    margin-top: 15px;
  }
  h2 {
    font-size: calc(12pt * var(--rb-scale, 1));
    font-weight: 700;
    font-variant: small-caps;
    letter-spacing: 1.2px;
    color: var(--ink);
    margin: 0 0 7px;
    padding-bottom: 3px;
    border-bottom: 1px solid var(--hair);
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
  }
  .dates {
    color: var(--muted);
    font-size: calc(9.3pt * var(--rb-scale, 1));
    font-style: italic;
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: calc(9.3pt * var(--rb-scale, 1));
    font-style: italic;
  }
  ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  li {
    margin: 2px 0;
  }
  .details {
    margin-top: 3px;
    color: var(--muted);
  }
  .skill {
    margin: 3px 0;
  }
</style>
