<script lang="ts">
  import type { Resume, TemplateId } from "./resume-schema";

  let { resume, variant = "classic" }: { resume: Resume; variant?: TemplateId } = $props();

  const contact = $derived(
    [
      resume.basics.location,
      resume.basics.email,
      resume.basics.phone,
      ...resume.basics.links.map((l) => l.url).filter(Boolean),
    ].filter(Boolean),
  );

  const hasSkills = $derived(resume.skills.some((s) => s.category || s.items));
</script>

<article class="sheet {variant}" data-sheet>
  <header>
    <div class="name">{resume.basics.fullName || "Your Name"}</div>
    {#if resume.basics.headline}<p class="headline">{resume.basics.headline}</p>{/if}
    {#if contact.length}
      <p class="contact">
        {#each contact as item, i}{#if i > 0}<span class="sep"> • </span>{/if}{item}{/each}
      </p>
    {/if}
  </header>

  {#if resume.summary}
    <section>
      <h2>Summary</h2>
      <p>{resume.summary}</p>
    </section>
  {/if}

  {#if resume.experience.some((e) => e.title || e.company)}
    <section>
      <h2>Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="entry-head">
              <span class="entry-title">
                <strong>{exp.title}</strong>{#if exp.company}<span class="at">
                    — {exp.company}</span
                  >{/if}{#if exp.location}, {exp.location}{/if}
              </span>
              {#if exp.start || exp.end}
                <span class="dates">{exp.start}{#if exp.end} – {exp.end}{/if}</span>
              {/if}
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

  {#if resume.education.some((e) => e.school)}
    <section>
      <h2>Education</h2>
      {#each resume.education as ed}
        {#if ed.school}
          <div class="entry">
            <div class="entry-head">
              <span class="entry-title">
                <strong>{ed.degree}{#if ed.field}, {ed.field}{/if}</strong>
                <span class="at"> — {ed.school}</span>{#if ed.location}, {ed.location}{/if}
              </span>
              {#if ed.graduation}<span class="dates">{ed.graduation}</span>{/if}
            </div>
            {#if ed.details}<p class="details">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}

  {#if hasSkills}
    <section>
      <h2>Skills</h2>
      {#each resume.skills as group}
        {#if group.category || group.items}
          <p class="skill-row">
            {#if group.category}<strong>{group.category}:</strong> {/if}{group.items}
          </p>
        {/if}
      {/each}
    </section>
  {/if}
</article>

<style>
  /* Base: single-column, standard headings, contact in body — ATS-safe by design. */
  .sheet {
    background: #fff;
    color: #111;
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.4;
    padding: 16mm 16mm;
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
  }
  .name {
    font-size: 22pt;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.3px;
  }
  .headline {
    margin: 2px 0 0;
    font-size: 11.5pt;
    color: #333;
  }
  .contact {
    margin: 6px 0 0;
    font-size: 9.5pt;
    color: #333;
  }
  section {
    margin-top: 14px;
  }
  h2 {
    font-size: 11pt;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    margin: 0 0 6px;
    border-bottom: 1px solid #ddd;
    padding-bottom: 2px;
  }
  p {
    margin: 0 0 4px;
  }
  .entry {
    margin-bottom: 9px;
  }
  .entry-head {
    display: flex;
    justify-content: space-between;
    gap: 12px;
  }
  .dates {
    color: #555;
    font-size: 9.5pt;
    white-space: nowrap;
  }
  .at {
    font-weight: 400;
  }
  ul {
    margin: 3px 0 0;
    padding-left: 18px;
  }
  li {
    margin: 1px 0;
  }
  .skill-row {
    margin: 2px 0;
  }

  /* Modern: accent colour on name + heading rules. */
  .modern .name {
    color: #1a4fa0;
  }
  .modern h2 {
    color: #1a4fa0;
    border-bottom-color: #1a4fa0;
  }

  /* Compact: tighter type + spacing to fit more on one page. */
  .compact {
    font-size: 9.5pt;
    line-height: 1.3;
    padding: 12mm 14mm;
  }
  .compact .name {
    font-size: 18pt;
  }
  .compact section {
    margin-top: 9px;
  }
  .compact .entry {
    margin-bottom: 6px;
  }
</style>
