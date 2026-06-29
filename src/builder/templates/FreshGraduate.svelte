<script lang="ts">
  import type { Resume } from "../resume-schema";
  import { normalizeUrl } from "../resume-core";
  import { type SectionKey, defaultOrder } from "../section-order";
  let { resume, sectionOrder = defaultOrder() }: { resume: Resume; sectionOrder?: SectionKey[] } = $props();

  const fullName = $derived(resume.basics.fullName || "Your Name");
  const initials = $derived(
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?",
  );
  const links = $derived(
    (resume.basics.links ?? []).filter((l) => l.url || l.label),
  );
  const hasContact = $derived(
    Boolean(
      resume.basics.location ||
        resume.basics.email ||
        resume.basics.phone ||
        links.length,
    ),
  );

  const jt = $derived(resume.jobTarget);
  const jobTargetMeta = $derived(
    [jt.employmentType, jt.locations, jt.salary, jt.availability].filter(
      Boolean,
    ),
  );
  const hasJobTarget = $derived(Boolean(jt.title) || jobTargetMeta.length > 0);
</script>

<article class="sheet" data-sheet>
  <header class="masthead">
    <div class="id">
      <span class="flag" aria-hidden="true"></span>
      <div class="id-text">
        <h1 class="name">{fullName}</h1>
        {#if resume.basics.headline}
          <div class="role">{resume.basics.headline}</div>
        {/if}
      </div>
    </div>
    <svg class="motif" width="74" height="46" viewBox="0 0 74 46" aria-hidden="true">
      <defs>
        <pattern id="fg-dots" width="12" height="12" patternUnits="userSpaceOnUse">
          <circle cx="2.4" cy="2.4" r="2.4" fill="#a9c4f0" />
        </pattern>
      </defs>
      <rect width="74" height="46" fill="url(#fg-dots)" />
    </svg>
  </header>

  <div class="body">
    <aside class="sidebar">
      <div class="avatar">
        {#if resume.basics.photo}
          <img src={resume.basics.photo} alt={fullName} />
        {:else}
          <span class="initials">{initials}</span>
        {/if}
      </div>

      {#if hasContact}
        <section class="block">
          <h2 class="sec sec-side">
            <span class="sec-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 6h16v12H4z" />
                <path d="M4 8l8 5 8-5" />
              </svg>
            </span>
            Contact
          </h2>
          <ul class="contact">
            {#if resume.basics.location}
              <li>
                <span class="c-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z" />
                    <circle cx="12" cy="10" r="2.4" />
                  </svg>
                </span>
                <span class="c-text">{resume.basics.location}</span>
              </li>
            {/if}
            {#if resume.basics.email}
              <li>
                <span class="c-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </span>
                <a class="c-text" href={`mailto:${resume.basics.email}`}>{resume.basics.email}</a>
              </li>
            {/if}
            {#if resume.basics.phone}
              <li>
                <span class="c-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                <a class="c-text" href={`tel:${resume.basics.phone}`}>{resume.basics.phone}</a>
              </li>
            {/if}
            {#each links as link}
              <li>
                <span class="c-ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
                    <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
                  </svg>
                </span>
                <a class="c-text" href={normalizeUrl(link.url)}>{link.label || link.url}</a>
              </li>
            {/each}
          </ul>
        </section>
      {/if}

      {#if resume.skills.some((s) => s.category || s.items)}
        <section class="block">
          <h2 class="sec sec-side">
            <span class="sec-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />
              </svg>
            </span>
            Skills
          </h2>
          {#each resume.skills as group}
            {#if group.category || group.items}
              <div class="skill-group">
                {#if group.category}<div class="skill-cat">{group.category}</div>{/if}
                {#if group.items}
                  <div class="chips">
                    {#each group.items.split(",").map((s) => s.trim()).filter(Boolean) as item}
                      <span class="chip">{item}</span>
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
        {#if key === "summary"}{@render summarySec()}
        {:else if key === "highlights"}{@render highlightsSec()}
        {:else if key === "jobTarget"}{@render jobTargetSec()}
        {:else if key === "experience"}{@render experienceSec()}
        {:else if key === "projects"}{@render projectsSec()}
        {:else if key === "education"}{@render educationSec()}
        {/if}
      {/each}
    </main>
  </div>
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="8.5" />
            <circle cx="12" cy="12" r="3.5" />
          </svg>
        </span>
        Objective
      </h2>
      <p class="summary">{resume.summary}</p>
    </section>
  {/if}
{/snippet}

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 13l4 4 10-10" />
          </svg>
        </span>
        Highlights
      </h2>
      <ul class="bullets">
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="4.5" />
            <circle cx="12" cy="12" r="0.6" />
          </svg>
        </span>
        Job Target
      </h2>
      <div class="entry">
        {#if jt.title}<div class="primary">{jt.title}</div>{/if}
        {#if jobTargetMeta.length}<p class="detail">{jobTargetMeta.join(" · ")}</p>{/if}
      </div>
    </section>
  {/if}
{/snippet}

{#snippet educationSec()}
  {#if resume.education.some((e) => e.school)}
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9l10-4 10 4-10 4-10-4z" />
            <path d="M6 11.2v4c0 1.6 2.7 3 6 3s6-1.4 6-3v-4" />
            <path d="M22 9v5" />
          </svg>
        </span>
        Education
      </h2>
      {#each resume.education as ed}
        {#if ed.school}
          <div class="entry">
            <div class="entry-head">
              <span class="primary">
                {ed.degree}{#if ed.degree && ed.field}, {/if}{ed.field}
              </span>
              {#if ed.graduation}<span class="period">{ed.graduation}</span>{/if}
            </div>
            <div class="org">
              {ed.school}{#if ed.location} · {ed.location}{/if}
            </div>
            {#if ed.details}<p class="detail">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="8" width="18" height="12" rx="2" />
            <path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <path d="M3 13h18" />
          </svg>
        </span>
        Experience
      </h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="entry-head">
              <span class="primary">{exp.title}</span>
              {#if exp.start || exp.end}
                <span class="period">
                  {exp.start}{#if exp.start && exp.end} – {/if}{exp.end}
                </span>
              {/if}
            </div>
            {#if exp.company || exp.location}
              <div class="org">
                {exp.company}{#if exp.company && exp.location} · {/if}{exp.location}
              </div>
            {/if}
            {#if exp.bullets?.some(Boolean)}
              <ul class="bullets">
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
    <section class="block">
      <h2 class="sec">
        <span class="sec-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 7h6l2 2h10v9a2 2 0 0 1-2 2H3z" />
            <path d="M3 7V5a2 2 0 0 1 2-2h3l2 2" />
          </svg>
        </span>
        Projects
      </h2>
      {#each resume.projects as proj}
        {#if proj.name || proj.role}
          <div class="entry">
            <div class="entry-head">
              <span class="primary">{proj.name}</span>
              {#if proj.start || proj.end}
                <span class="period">
                  {proj.start}{#if proj.start && proj.end} – {/if}{proj.end}
                </span>
              {/if}
            </div>
            {#if proj.role}<div class="org">{proj.role}</div>{/if}
            {#if proj.link}
              <p class="detail">
                <a class="c-text" href={normalizeUrl(proj.link)}>{proj.link}</a>
              </p>
            {/if}
            {#if proj.bullets?.some(Boolean)}
              <ul class="bullets">
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
    --accent: var(--rb-accent, #2f5fd0);
    --accent-dark: #16243f;
    --accent-soft: #eef4fd;
    --chip: #e1ebfb;
    --rule: #d2e0f6;
    --ink: #28323f;
    --muted: #6a7686;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Segoe UI", "Helvetica Neue", Arial, sans-serif);
    font-size: calc(10pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .sheet *,
  .sheet *::before,
  .sheet *::after {
    box-sizing: border-box;
  }

  /* Masthead */
  .masthead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10mm;
    padding: 13mm 14mm 9mm;
    border-bottom: 1px solid var(--rule);
  }
  .id {
    display: flex;
    align-items: stretch;
    gap: 11px;
    min-width: 0;
  }
  .flag {
    flex: none;
    width: 9px;
    align-self: stretch;
    background: var(--accent);
    clip-path: polygon(0 0, 100% 0, 100% 78%, 50% 100%, 0 78%);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .id-text {
    min-width: 0;
  }
  .name {
    margin: 0;
    font-size: calc(27pt * var(--rb-scale, 1));
    font-weight: 800;
    letter-spacing: 0.5px;
    line-height: 1.04;
    text-transform: uppercase;
    color: var(--accent-dark);
  }
  .role {
    margin-top: 5px;
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 2.6px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .motif {
    flex: none;
    opacity: 0.95;
  }

  /* Body grid */
  .body {
    display: grid;
    grid-template-columns: 61mm 1fr;
    flex: 1;
  }
  .sidebar {
    background: var(--accent-soft);
    padding: 10mm 8mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .main {
    padding: 10mm 12mm 10mm 10mm;
    min-width: 0;
  }

  /* Avatar */
  .avatar {
    width: 30mm;
    height: 30mm;
    margin: 0 auto 9mm;
    border-radius: 50%;
    overflow: hidden;
    background: var(--accent);
    box-shadow: 0 0 0 3px #fff, 0 0 0 5px var(--accent);
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
    color: #fff;
    font-size: calc(17pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1px;
  }

  /* Section headings */
  .block {
    margin-bottom: 8mm;
  }
  .block:last-child {
    margin-bottom: 0;
  }
  .sec {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 9px;
    padding-bottom: 6px;
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.6px;
    text-transform: uppercase;
    color: var(--accent-dark);
    border-bottom: 1.5px solid var(--rule);
  }
  .sec-side {
    font-size: calc(10pt * var(--rb-scale, 1));
    letter-spacing: 1.4px;
  }
  .sec-icon {
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--accent);
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .sec-icon svg {
    width: 13px;
    height: 13px;
  }

  /* Contact */
  .contact {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .contact li {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 7px;
    font-size: calc(9pt * var(--rb-scale, 1));
  }
  .contact li:last-child {
    margin-bottom: 0;
  }
  .c-ico {
    flex: none;
    width: 20px;
    height: 20px;
    border-radius: 6px;
    background: var(--chip);
    color: var(--accent);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .c-ico svg {
    width: 12px;
    height: 12px;
  }
  .c-text {
    min-width: 0;
    word-break: break-word;
    color: var(--ink);
    text-decoration: none;
  }
  a.c-text:hover {
    color: var(--accent);
  }

  /* Skills */
  .skill-group {
    margin-bottom: 9px;
  }
  .skill-group:last-child {
    margin-bottom: 0;
  }
  .skill-cat {
    font-size: calc(8.6pt * var(--rb-scale, 1));
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--accent-dark);
    margin-bottom: 5px;
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
  .chip {
    background: #fff;
    border: 1px solid var(--rule);
    color: var(--accent);
    font-size: calc(8.4pt * var(--rb-scale, 1));
    font-weight: 600;
    padding: 2px 9px;
    border-radius: 11px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Entries */
  .entry {
    margin-bottom: 9px;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .entry-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 10px;
  }
  .primary {
    font-size: calc(10.6pt * var(--rb-scale, 1));
    font-weight: 700;
    color: var(--accent-dark);
  }
  .period {
    flex: none;
    background: var(--chip);
    color: var(--accent);
    font-size: calc(8.2pt * var(--rb-scale, 1));
    font-weight: 600;
    padding: 1.5px 8px;
    border-radius: 10px;
    white-space: nowrap;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .org {
    margin-top: 2px;
    font-size: calc(9.6pt * var(--rb-scale, 1));
    font-weight: 600;
    color: var(--accent);
  }
  .detail {
    margin: 3px 0 0;
    font-size: calc(9.3pt * var(--rb-scale, 1));
    color: var(--muted);
  }
  .summary {
    margin: 0;
    color: var(--ink);
  }
  .bullets {
    margin: 5px 0 0;
    padding: 0;
    list-style: none;
  }
  .bullets li {
    position: relative;
    padding-left: 14px;
    margin: 3px 0;
  }
  .bullets li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.52em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
</style>
