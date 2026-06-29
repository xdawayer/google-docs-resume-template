<script lang="ts">
  import type { Resume } from "../resume-schema";
  import { type SectionKey, defaultOrder } from "../section-order";
  let { resume, sectionOrder = defaultOrder() }: { resume: Resume; sectionOrder?: SectionKey[] } =
    $props();

  const fullName = $derived(resume.basics.fullName || "Your Name");

  // Split the name so the surname can take the teal accent, like the reference.
  const nameParts = $derived.by(() => {
    const trimmed = fullName.trim();
    const i = trimmed.indexOf(" ");
    if (i === -1) return { first: trimmed, last: "" };
    return { first: trimmed.slice(0, i), last: trimmed.slice(i + 1) };
  });

  const initials = $derived(
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join(""),
  );

  // CONTACT lives in the sidebar; each entry carries an icon type.
  const contactItems = $derived(
    [
      { type: "email", value: resume.basics.email },
      { type: "phone", value: resume.basics.phone },
      { type: "location", value: resume.basics.location },
    ].filter((c) => c.value),
  );

  const links = $derived((resume.basics.links || []).filter((l) => l.label || l.url));

  // Job Target objective block.
  const jt = $derived(resume.jobTarget);
  const jobTargetMeta = $derived(
    [jt.employmentType, jt.locations, jt.salary, jt.availability].filter(Boolean),
  );
  const hasJobTarget = $derived(Boolean(jt.title) || jobTargetMeta.length > 0);

  // Flatten "comma, separated" item strings into individual meter rows.
  const skillRows = $derived.by(() =>
    resume.skills
      .filter((g) => g.category || g.items)
      .map((g) => ({
        category: g.category,
        items: (g.items || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      }))
      .filter((g) => g.category || g.items.length),
  );

  // Deterministic meter fill so the bars look designed but never random per render.
  function barWidth(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
    return 74 + (h % 22); // 74%–95%
  }
</script>

{#snippet icon(type: string)}
  {#if type === "email"}
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg
    >
  {:else if type === "phone"}
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><path
        d="M5 4h3l2 5-2 1c1 2 3 4 5 5l1-2 5 2v3c0 1-1 2-2 2A16 16 0 0 1 3 6c0-1 1-2 2-2z"
      /></svg
    >
  {:else if type === "location"}
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><path d="M12 21s7-6.2 7-11a7 7 0 0 0-14 0c0 4.8 7 11 7 11z" /><circle
        cx="12"
        cy="10"
        r="2.4"
      /></svg
    >
  {:else}
    <svg viewBox="0 0 24 24" aria-hidden="true"
      ><path d="M9 13a4 4 0 0 0 6 .5l3-3a4 4 0 0 0-5.7-5.7L11 6" /><path
        d="M15 11a4 4 0 0 0-6-.5l-3 3A4 4 0 0 0 11.7 19L13 18"
      /></svg
    >
  {/if}
{/snippet}

<article class="sheet" data-sheet>
  <div class="deco-dots" aria-hidden="true">
    {#each Array(20) as _}<span></span>{/each}
  </div>
  <div class="deco-blob" aria-hidden="true"></div>

  <aside class="sidebar">
    <div class="avatar-wrap">
      <div class="avatar">
        {#if resume.basics.photo}
          <img src={resume.basics.photo} alt={fullName} />
        {:else}
          <span class="initials">{initials || "YN"}</span>
        {/if}
      </div>
    </div>

    {#if contactItems.length}
      <section class="side-sec">
        <h2 class="side-head"><span class="marker"></span>Contact</h2>
        <ul class="contact">
          {#each contactItems as c}
            <li>
              <span class="ico">{@render icon(c.type)}</span>
              <span class="ctext">{c.value}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if skillRows.length}
      <section class="side-sec">
        <h2 class="side-head"><span class="marker"></span>Skills</h2>
        <div class="skills">
          {#each skillRows as group}
            {#if group.category}<div class="skill-cat">{group.category}</div>{/if}
            {#each group.items as item}
              <div class="skill-row">
                <span class="skill-name">{item}</span>
                <span class="meter"><span class="fill" style="width:{barWidth(item)}%"></span></span>
              </div>
            {/each}
          {/each}
        </div>
      </section>
    {/if}

    {#if links.length}
      <section class="links-block">
        <h2 class="side-head on-dark"><span class="marker light"></span>Links</h2>
        <ul class="links">
          {#each links as l}
            <li>
              <span class="link-label">{l.label || l.url}</span>
              {#if l.label && l.url}<span class="link-url">{l.url}</span>{/if}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
  </aside>

  <main class="main">
    <header class="name-head">
      <h1 class="name">
        <span class="name-first">{nameParts.first}</span>{#if nameParts.last}{" "}<span
            class="name-last">{nameParts.last}</span
          >{/if}
      </h1>
      {#if resume.basics.headline}
        <div class="role">{resume.basics.headline}</div>
      {/if}
      <span class="role-rule"></span>
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
  </main>
</article>

{#snippet summarySec()}
  {#if resume.summary}
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Profile</h2>
      <p class="summary">{resume.summary}</p>
    </section>
  {/if}
{/snippet}

{#snippet highlightsSec()}
  {#if resume.highlights.some(Boolean)}
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Highlights</h2>
      <ul class="bullets">
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}
{/snippet}

{#snippet jobTargetSec()}
  {#if hasJobTarget}
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Job Target</h2>
      {#if jt.title}<div class="job-title">{jt.title}</div>{/if}
      {#if jobTargetMeta.length}
        <div class="job-sub"><span class="job-loc">{jobTargetMeta.join(" · ")}</span></div>
      {/if}
    </section>
  {/if}
{/snippet}

{#snippet experienceSec()}
  {#if resume.experience.some((e) => e.title || e.company)}
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="job">
            <div class="job-head">
              <span class="job-title">{exp.title}</span>
              {#if exp.start || exp.end}
                <span class="job-date"
                  >{exp.start}{#if exp.start && exp.end} – {/if}{exp.end}</span
                >
              {/if}
            </div>
            {#if exp.company || exp.location}
              <div class="job-sub">
                {#if exp.company}<span class="job-company">{exp.company}</span>{/if}{#if exp.company && exp.location}<span
                    class="job-dot">·</span
                  >{/if}{#if exp.location}<span class="job-loc">{exp.location}</span>{/if}
              </div>
            {/if}
            {#if exp.bullets.some(Boolean)}
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
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Projects</h2>
      {#each resume.projects as proj}
        {#if proj.name || proj.role}
          <div class="job">
            <div class="job-head">
              <span class="job-title">{proj.name}</span>
              {#if proj.start || proj.end}
                <span class="job-date"
                  >{proj.start}{#if proj.start && proj.end} – {/if}{proj.end}</span
                >
              {/if}
            </div>
            {#if proj.role || proj.link}
              <div class="job-sub">
                {#if proj.role}<span class="job-company">{proj.role}</span>{/if}{#if proj.role && proj.link}<span
                    class="job-dot">·</span
                  >{/if}{#if proj.link}<span class="job-loc">{proj.link}</span>{/if}
              </div>
            {/if}
            {#if proj.bullets.some(Boolean)}
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

{#snippet educationSec()}
  {#if resume.education.some((e) => e.school || e.degree)}
    <section class="main-sec">
      <h2 class="main-head"><span class="dot"></span>Education</h2>
      {#each resume.education as ed}
        {#if ed.school || ed.degree}
          <div class="edu">
            <div class="job-head">
              <span class="job-title"
                >{ed.degree}{#if ed.degree && ed.field}, {/if}{ed.field}</span
              >
              {#if ed.graduation}<span class="job-date">{ed.graduation}</span>{/if}
            </div>
            {#if ed.school || ed.location}
              <div class="job-sub">
                {#if ed.school}<span class="job-company">{ed.school}</span>{/if}{#if ed.school && ed.location}<span
                    class="job-dot">·</span
                  >{/if}{#if ed.location}<span class="job-loc">{ed.location}</span>{/if}
              </div>
            {/if}
            {#if ed.details}<p class="edu-details">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
{/snippet}

<style>
  .sheet {
    --teal: var(--rb-accent, #2f8f8f);
    --teal-deep: #246f6f;
    --teal-tint: #e9f3f2;
    --ink: #283232;
    --muted: #6a7575;
    --line: #d9e6e4;
    position: relative;
    display: grid;
    grid-template-columns: 72mm 1fr;
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, "Helvetica Neue", Arial, sans-serif);
    font-size: calc(9.6pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    overflow: hidden;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Corner decoration: a small dot grid + a soft teal blob */
  .deco-dots {
    position: absolute;
    top: 13mm;
    right: 12mm;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 4px;
    z-index: 3;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .deco-dots span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--teal);
    opacity: 0.55;
  }
  .deco-blob {
    position: absolute;
    top: -26mm;
    left: -26mm;
    width: 58mm;
    height: 58mm;
    border-radius: 50%;
    background: var(--teal);
    opacity: 0.16;
    z-index: 2;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ===== Sidebar ===== */
  .sidebar {
    position: relative;
    z-index: 2;
    background: var(--teal-tint);
    padding: 16mm 9mm 12mm;
    display: flex;
    flex-direction: column;
    gap: 9mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .avatar-wrap {
    display: flex;
    justify-content: center;
  }
  .avatar {
    width: 42mm;
    height: 42mm;
    border-radius: 50%;
    background: var(--teal);
    border: 3px solid #fff;
    box-shadow: 0 0 0 2px var(--teal);
    overflow: hidden;
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
    font-size: calc(22pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1px;
  }

  .side-head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0 0 9px;
    font-size: calc(10pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: var(--teal-deep);
  }
  .marker {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--teal);
    box-shadow: inset 0 0 0 2.5px #fff;
    flex: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .marker.light {
    background: #fff;
    box-shadow: inset 0 0 0 2.5px var(--teal);
  }

  .contact {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .contact li {
    display: flex;
    align-items: center;
    gap: 9px;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--ink);
  }
  .ico {
    flex: none;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .ico :global(svg) {
    width: 12px;
    height: 12px;
    fill: none;
    stroke: var(--teal);
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .ctext {
    word-break: break-word;
    line-height: calc(1.35 * var(--rb-line-scale, 1));
  }

  .skills {
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .skill-cat {
    font-size: calc(8pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--muted);
    margin: 4px 0 1px;
  }
  .skill-cat:first-child {
    margin-top: 0;
  }
  .skill-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .skill-name {
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--ink);
  }
  .meter {
    height: 5px;
    border-radius: 3px;
    background: #d3e6e3;
    overflow: hidden;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 3px;
    background: var(--teal);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .links-block {
    margin-top: auto;
    background: var(--teal-deep);
    color: #fff;
    border-radius: 10px;
    padding: 11px 13px 13px;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .side-head.on-dark {
    color: #fff;
  }
  .links {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  .links li {
    display: flex;
    flex-direction: column;
    line-height: calc(1.3 * var(--rb-line-scale, 1));
  }
  .link-label {
    font-size: calc(9pt * var(--rb-scale, 1));
    font-weight: 600;
  }
  .link-url {
    font-size: calc(7.6pt * var(--rb-scale, 1));
    color: #cfe6e3;
    word-break: break-all;
  }

  /* ===== Main column ===== */
  .main {
    position: relative;
    z-index: 1;
    padding: 16mm 13mm 14mm;
  }
  .name-head {
    margin-bottom: 11mm;
  }
  .name {
    margin: 0;
    font-size: calc(30pt * var(--rb-scale, 1));
    font-weight: 800;
    line-height: 1.02;
    letter-spacing: 1px;
    text-transform: uppercase;
  }
  .name-first {
    color: var(--ink);
  }
  .name-last {
    color: var(--teal);
  }
  .role {
    margin-top: 7px;
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 600;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--muted);
  }
  .role-rule {
    display: block;
    margin-top: 10px;
    width: 46mm;
    height: 3px;
    border-radius: 2px;
    background: var(--teal);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  .main-sec {
    margin-bottom: 8mm;
  }
  .main-sec:last-child {
    margin-bottom: 0;
  }
  .main-head {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 9px;
    font-size: calc(11.5pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--teal-deep);
  }
  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--teal);
    box-shadow: inset 0 0 0 3px #fff;
    flex: none;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .summary {
    margin: 0;
    color: #3c4747;
  }

  .job,
  .edu {
    margin-bottom: 6mm;
  }
  .job:last-child,
  .edu:last-child {
    margin-bottom: 0;
  }
  .job-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  .job-title {
    font-size: calc(10.5pt * var(--rb-scale, 1));
    font-weight: 700;
    color: var(--ink);
  }
  .job-date {
    flex: none;
    font-size: calc(8.6pt * var(--rb-scale, 1));
    font-weight: 600;
    color: #fff;
    background: var(--teal);
    padding: 2px 8px;
    border-radius: 10px;
    white-space: nowrap;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .job-sub {
    margin-top: 2px;
    font-size: calc(9pt * var(--rb-scale, 1));
  }
  .job-company {
    color: var(--teal-deep);
    font-weight: 600;
  }
  .job-dot {
    margin: 0 6px;
    color: var(--muted);
  }
  .job-loc {
    color: var(--muted);
  }
  .bullets {
    margin: 5px 0 0;
    padding-left: 0;
    list-style: none;
  }
  .bullets li {
    position: relative;
    padding-left: 15px;
    margin: 3px 0;
    color: #3c4747;
  }
  .bullets li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.5em;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--teal);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .edu-details {
    margin: 4px 0 0;
    font-size: calc(9pt * var(--rb-scale, 1));
    color: var(--muted);
  }
</style>
