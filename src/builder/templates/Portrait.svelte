<script lang="ts">
  import type { Resume } from "../resume-schema";
  import { type SectionKey, defaultOrder } from "../section-order";
  import { safePhoto } from "../resume-core";
  let { resume, sectionOrder = defaultOrder() }: { resume: Resume; sectionOrder?: SectionKey[] } =
    $props();

  const fullName = $derived(resume.basics.fullName || "Your Name");
  const photo = $derived(safePhoto(resume.basics.photo));
  const initials = $derived(
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join(""),
  );

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
  <header class="hd">
    <div class="avatar">
      {#if photo}
        <img src={photo} alt={fullName} />
      {:else}
        <span class="initials">{initials}</span>
      {/if}
    </div>
    <div class="who">
      <h1 class="name">{fullName}</h1>
      {#if resume.basics.headline}<p class="role">{resume.basics.headline}</p>{/if}
      {#if contact.length}
        <div class="contact">
          {#each contact as item, i}{#if i > 0}<span class="sep">·</span>{/if}<span>{item}</span
            >{/each}
        </div>
      {/if}
    </div>
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
      <section class="sec">
        <h2>Skills</h2>
        {#each resume.skills as g}
          {#if g.category || g.items}
            <p class="skill"
              >{#if g.category}<strong>{g.category}:</strong> {/if}{g.items}</p
            >
          {/if}
        {/each}
      </section>
    {/if}
  </div>
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section class="sec">
      <h2>Profile</h2>
      <p>{resume.summary}</p>
    </section>
  {/if}
{/snippet}

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section class="sec">
      <h2>Highlights</h2>
      <ul>
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section class="sec">
      <h2>Job Target</h2>
      {#if jt.title}<p class="primary">{jt.title}</p>{/if}
      {#if jobTargetMeta.length}<p class="meta">{jobTargetMeta.join(" · ")}</p>{/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section class="sec">
      <h2>Work Experience</h2>
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
    <section class="sec">
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
    <section class="sec">
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
  /* Portrait — a photo-forward personal-brand layout: a tinted header band pairs
     a circular headshot (or initials) with the name, over a clean single column. */
  .sheet {
    --accent: var(--rb-accent, #3949ab);
    --tint: color-mix(in srgb, var(--accent) 9%, #fff);
    --ink: #1f2430;
    --muted: #61687a;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10.2pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
  }
  .hd {
    display: flex;
    align-items: center;
    gap: 9mm;
    padding: 13mm 16mm;
    background: var(--tint);
    border-bottom: 3px solid var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .avatar {
    flex: 0 0 auto;
    width: 30mm;
    height: 30mm;
    border-radius: 50%;
    overflow: hidden;
    background: var(--accent);
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .initials {
    font-size: calc(20pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1px;
    color: #fff;
  }
  .who {
    min-width: 0;
  }
  .name {
    margin: 0;
    font-size: calc(25pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1.05;
    color: #1a1f2b;
  }
  .role {
    margin: 5px 0 0;
    font-size: calc(11.5pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .contact {
    margin-top: 8px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 6px;
    color: var(--accent);
  }
  .body {
    padding: 11mm 16mm 14mm;
  }
  .sec {
    margin-bottom: 8mm;
  }
  .sec:last-child {
    margin-bottom: 0;
  }
  h2 {
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--accent);
    margin: 0 0 4mm;
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
  ul {
    margin: 3px 0 0;
    padding-left: 17px;
  }
  li {
    margin: 2px 0;
  }
  .skill {
    margin: 3px 0;
  }
  .details {
    margin-top: 2px;
    color: #3a4152;
  }
</style>
