<script lang="ts">
  import type { Resume } from "../resume-schema";
  let { resume }: { resume: Resume } = $props();

  const contact = $derived(
    [
      resume.basics.location,
      resume.basics.email,
      resume.basics.phone,
      ...resume.basics.links.map((l) => l.url).filter(Boolean),
    ].filter(Boolean),
  );
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

  {#if resume.summary}
    <section>
      <h2>Professional Summary</h2>
      <p>{resume.summary}</p>
    </section>
  {/if}

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

  {#if resume.skills.some((s) => s.category || s.items)}
    <section>
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
</article>

<style>
  .sheet {
    --ink: #1a1a1a;
    --muted: #5a5a5a;
    --rule: var(--rb-accent, #1a1a1a);
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10.3pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 18mm 18mm 16mm;
  }
  header {
    text-align: center;
    margin-bottom: 16px;
  }
  .name {
    font-size: calc(23pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 4px;
    text-transform: uppercase;
  }
  .headline {
    margin-top: 4px;
    font-size: calc(10.5pt * var(--rb-scale, 1));
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .contact {
    margin-top: 8px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .contact .sep {
    margin: 0 7px;
    color: #b0b0b0;
  }
  section {
    margin-top: 15px;
  }
  h2 {
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 8px;
    padding-bottom: 4px;
    border-bottom: 1.5px solid var(--rule);
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
    font-size: calc(9pt * var(--rb-scale, 1));
    white-space: nowrap;
  }
  .meta {
    color: var(--muted);
    font-size: calc(9pt * var(--rb-scale, 1));
    font-style: italic;
  }
  ul {
    margin: 4px 0 0;
    padding-left: 17px;
  }
  li {
    margin: 2px 0;
  }
  .skill {
    margin: 3px 0;
  }
</style>
