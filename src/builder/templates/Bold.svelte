<script lang="ts">
  import type { Resume } from "../resume-schema";
  import { type SectionKey, defaultOrder } from "../section-order";
  import { safePhoto } from "../resume-core";
  let { resume, sectionOrder = defaultOrder() }: { resume: Resume; sectionOrder?: SectionKey[] } =
    $props();

  const photo = $derived(safePhoto(resume.basics.photo));

  const initials = $derived(
    (resume.basics.fullName || "Your Name")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
  );

  const contactItems = $derived(
    [
      resume.basics.phone ? { type: "phone", text: resume.basics.phone } : null,
      resume.basics.email ? { type: "mail", text: resume.basics.email } : null,
      resume.basics.location ? { type: "pin", text: resume.basics.location } : null,
      ...resume.basics.links.map((l) =>
        l.url ? { type: "link", text: l.label || l.url } : null,
      ),
    ].filter((x): x is { type: string; text: string } => Boolean(x)),
  );

  const hasExperience = $derived(
    resume.experience.some((e) => e.title || e.company),
  );
  const hasEducation = $derived(
    resume.education.some((e) => e.school || e.degree || e.field),
  );
  const hasSkills = $derived(resume.skills.some((s) => s.category || s.items));

  const jt = $derived(resume.jobTarget);
  const jobTargetMeta = $derived(
    [jt.employmentType, jt.locations, jt.salary, jt.availability].filter(Boolean),
  );
  const hasJobTarget = $derived(Boolean(jt.title) || jobTargetMeta.length > 0);
</script>

{#snippet iconPhone()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
{/snippet}

{#snippet iconMail()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 6 10-6" /></svg>
{/snippet}

{#snippet iconPin()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
{/snippet}

{#snippet iconLink()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
{/snippet}

{#snippet iconAbout()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
{/snippet}

{#snippet iconEdu()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c0 1 2.5 3 6 3s6-2 6-3v-5" /></svg>
{/snippet}

{#snippet iconSkills()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 2.09 5.26L19.5 9l-4.2 3.51L16.7 18 12 14.8 7.3 18l1.4-5.49L4.5 9l5.41-.74z" /></svg>
{/snippet}

{#snippet iconExp()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
{/snippet}

{#snippet iconHighlights()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
{/snippet}

{#snippet iconTarget()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
{/snippet}

{#snippet iconProjects()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" /></svg>
{/snippet}

<article class="sheet" data-sheet>
  <aside class="sidebar">
    <div class="identity">
      {#if photo}
        <img class="avatar" src={photo} alt={resume.basics.fullName || "Profile"} />
      {:else}
        <div class="avatar initials">{initials}</div>
      {/if}
      <div class="name">{resume.basics.fullName || "Your Name"}</div>
      {#if resume.basics.headline}<div class="role">{resume.basics.headline}</div>{/if}
    </div>

    {#if contactItems.length}
      <div class="contact">
        {#each contactItems as item}
          <div class="citem">
            {#if item.type === "phone"}{@render iconPhone()}{:else if item.type === "mail"}{@render iconMail()}{:else if item.type === "pin"}{@render iconPin()}{:else}{@render iconLink()}{/if}
            <span>{item.text}</span>
          </div>
        {/each}
      </div>
    {/if}

    {#if resume.summary}
      <section class="side-section">
        <h2 class="side-h"><span class="badge">{@render iconAbout()}</span>About</h2>
        <p class="about-text">{resume.summary}</p>
      </section>
    {/if}

    {#if hasEducation}
      <section class="side-section">
        <h2 class="side-h"><span class="badge">{@render iconEdu()}</span>Education</h2>
        {#each resume.education as ed}
          {#if ed.school || ed.degree || ed.field}
            <div class="edu-item">
              {#if ed.degree || ed.field}
                <div class="edu-degree">{ed.degree}{#if ed.degree && ed.field}, {/if}{ed.field}</div>
              {/if}
              {#if ed.school}<div class="edu-school">{ed.school}</div>{/if}
              {#if ed.location || ed.graduation}
                <div class="edu-meta">{ed.location}{#if ed.location && ed.graduation} · {/if}{ed.graduation}</div>
              {/if}
              {#if ed.details}<div class="edu-details">{ed.details}</div>{/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}

    {#if hasSkills}
      <section class="side-section">
        <h2 class="side-h"><span class="badge">{@render iconSkills()}</span>Skills</h2>
        {#each resume.skills as g}
          {#if g.category || g.items}
            <div class="skill-group">
              {#if g.category}<div class="skill-cat">{g.category}</div>{/if}
              {#if g.items}
                <div class="chips">
                  {#each g.items
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean) as skill}
                    <span class="chip">{skill}</span>
                  {/each}
                </div>
              {/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}
  </aside>

  <main class="main">
    {#each sectionOrder as key (key)}
      {#if key === "highlights"}{@render highlightsSec()}
      {:else if key === "jobTarget"}{@render jobTargetSec()}
      {:else if key === "experience"}{@render experienceSec()}
      {:else if key === "projects"}{@render projectsSec()}
      {/if}
    {/each}
  </main>
</article>

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section>
      <h2 class="main-h"><span class="main-badge">{@render iconHighlights()}</span>Highlights</h2>
      <ul>
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section>
      <h2 class="main-h"><span class="main-badge">{@render iconTarget()}</span>Job Target</h2>
      {#if jt.title}<div class="job-title">{jt.title}</div>{/if}
      {#if jobTargetMeta.length}
        <div class="job-sub job-loc">{jobTargetMeta.join(" · ")}</div>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if hasExperience}
    <section>
      <h2 class="main-h"><span class="main-badge">{@render iconExp()}</span>Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="job">
            <div class="job-top">
              <span class="job-title">{exp.title || exp.company}</span>
              {#if exp.start || exp.end}
                <span class="job-dates">{exp.start}{#if exp.start && exp.end} – {/if}{exp.end}</span>
              {/if}
            </div>
            {#if (exp.title && exp.company) || exp.location}
              <div class="job-sub">
                {#if exp.title && exp.company}{exp.company}{/if}{#if exp.location}<span class="job-loc">{#if exp.title && exp.company} · {/if}{exp.location}</span>{/if}
              </div>
            {/if}
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
      <h2 class="main-h"><span class="main-badge">{@render iconProjects()}</span>Projects</h2>
      {#each resume.projects as proj}
        {#if proj.name || proj.role}
          <div class="job">
            <div class="job-top">
              <span class="job-title">{proj.name || proj.role}</span>
              {#if proj.start || proj.end}
                <span class="job-dates">{proj.start}{#if proj.start && proj.end} – {/if}{proj.end}</span>
              {/if}
            </div>
            {#if (proj.name && proj.role) || proj.link}
              <div class="job-sub">
                {#if proj.name && proj.role}{proj.role}{/if}{#if proj.link}<span class="job-loc">{#if proj.name && proj.role} · {/if}{proj.link}</span>{/if}
              </div>
            {/if}
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

<style>
  .sheet {
    --green: var(--rb-accent, #3fae5a);
    --charcoal: #222222;
    --ink: #1c2430;
    --muted: #6b7280;
    display: flex;
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    background: #ffffff;
    color: var(--ink);
    font-family: var(--rb-font, "Inter", "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ---------- Sidebar ---------- */
  .sidebar {
    width: 74mm;
    flex-shrink: 0;
    box-sizing: border-box;
    background: var(--charcoal);
    color: #e9ecef;
    padding: 13mm 9mm 12mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .identity {
    text-align: center;
    padding-bottom: 14px;
    margin-bottom: 6px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  }
  .avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    object-fit: cover;
    display: block;
    margin: 0 auto 13px;
    border: 3px solid var(--green);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .avatar.initials {
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--green);
    color: #ffffff;
    font-size: calc(25pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 1px;
    border-color: rgba(255, 255, 255, 0.2);
  }
  .name {
    font-size: calc(19pt * var(--rb-scale, 1));
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: #ffffff;
  }
  .role {
    margin-top: 6px;
    font-size: calc(8.3pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--green);
  }

  .contact {
    margin-top: 14px;
  }
  .citem {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 7px 0;
    font-size: calc(8.4pt * var(--rb-scale, 1));
    color: #cfd4da;
    word-break: break-word;
  }
  .citem svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    color: var(--green);
  }

  .side-section {
    margin-top: 19px;
  }
  .side-h {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 10px;
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.3px;
    text-transform: uppercase;
    color: #ffffff;
  }
  .badge {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    border-radius: 5px;
    background: var(--green);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .badge svg {
    width: 13px;
    height: 13px;
  }

  .about-text {
    margin: 0;
    font-size: calc(8.7pt * var(--rb-scale, 1));
    line-height: calc(1.55 * var(--rb-line-scale, 1));
    color: #c4cad1;
  }

  .edu-item {
    margin-bottom: 11px;
  }
  .edu-item:last-child {
    margin-bottom: 0;
  }
  .edu-degree {
    font-size: calc(9pt * var(--rb-scale, 1));
    font-weight: 700;
    line-height: calc(1.3 * var(--rb-line-scale, 1));
    color: #ffffff;
  }
  .edu-school {
    margin-top: 1px;
    font-size: calc(8.6pt * var(--rb-scale, 1));
    font-weight: 600;
    color: var(--green);
  }
  .edu-meta {
    margin-top: 2px;
    font-size: calc(8pt * var(--rb-scale, 1));
    color: #98a0a8;
  }
  .edu-details {
    margin-top: 3px;
    font-size: calc(8.2pt * var(--rb-scale, 1));
    line-height: calc(1.4 * var(--rb-line-scale, 1));
    color: #b3b9c0;
  }

  .skill-group {
    margin-bottom: 11px;
  }
  .skill-group:last-child {
    margin-bottom: 0;
  }
  .skill-cat {
    margin-bottom: 6px;
    font-size: calc(8.3pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #ffffff;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    font-size: calc(7.9pt * var(--rb-scale, 1));
    line-height: 1.2;
    color: #e7eaed;
    background: rgba(63, 174, 90, 0.16);
    border: 1px solid rgba(63, 174, 90, 0.45);
    border-radius: 20px;
    padding: 2.5px 8px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ---------- Main column ---------- */
  .main {
    flex: 1;
    box-sizing: border-box;
    background: #ffffff;
    padding: 13mm 12mm 12mm;
  }
  .main section + section {
    margin-top: 18px;
  }
  .main-h {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 0 0 15px;
    padding-bottom: 9px;
    font-size: calc(12.5pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--green);
    border-bottom: 2px solid rgba(63, 174, 90, 0.22);
  }
  .main-badge {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 6px;
    background: var(--green);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .main-badge svg {
    width: 14px;
    height: 14px;
  }

  .job {
    margin-bottom: 15px;
  }
  .job:last-child {
    margin-bottom: 0;
  }
  .job-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .job-title {
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 700;
    color: var(--ink);
  }
  .job-dates {
    font-size: calc(8.4pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 0.3px;
    color: var(--muted);
    white-space: nowrap;
  }
  .job-sub {
    margin-top: 2px;
    font-size: calc(9.3pt * var(--rb-scale, 1));
    font-weight: 700;
    color: var(--green);
  }
  .job-loc {
    color: var(--muted);
    font-weight: 500;
  }
  ul {
    margin: 7px 0 0;
    padding: 0;
    list-style: none;
  }
  li {
    position: relative;
    padding-left: 15px;
    margin: 4px 0;
    font-size: calc(9.3pt * var(--rb-scale, 1));
    line-height: calc(1.45 * var(--rb-line-scale, 1));
    color: #353c45;
  }
  li::before {
    content: "";
    position: absolute;
    left: 2px;
    top: 6.5px;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--green);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>
