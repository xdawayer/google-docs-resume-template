<script lang="ts">
  import type { Resume } from "../resume-schema";
  let { resume }: { resume: Resume } = $props();

  const fullName = $derived(resume.basics.fullName || "Your Name");

  const initials = $derived(
    fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join(""),
  );

  const links = $derived((resume.basics.links ?? []).filter((l) => l.url || l.label));

  const hasContact = $derived(
    Boolean(resume.basics.phone || resume.basics.email || resume.basics.location || links.length),
  );

  const hasSkills = $derived(resume.skills.some((s) => s.category || s.items));
</script>

<article class="sheet" data-sheet>
  <aside class="sidebar">
    <div class="id">
      <h1 class="name">{fullName}</h1>
      {#if resume.basics.headline}<p class="role">{resume.basics.headline}</p>{/if}
    </div>

    {#if hasContact}
      <section class="side-sec">
        <h2 class="side-h">Contact</h2>
        <ul class="contact">
          {#if resume.basics.phone}
            <li>
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"
                  ><path
                    d="M6.62 10.79c1.44 2.83 3.76 5.15 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
                  /></svg
                >
              </span>
              <span class="c-val">{resume.basics.phone}</span>
            </li>
          {/if}
          {#if resume.basics.email}
            <li>
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"
                  ><path
                    d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
                  /></svg
                >
              </span>
              <span class="c-val">{resume.basics.email}</span>
            </li>
          {/if}
          {#if resume.basics.location}
            <li>
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"
                  ><path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"
                  /></svg
                >
              </span>
              <span class="c-val">{resume.basics.location}</span>
            </li>
          {/if}
          {#each links as link}
            <li>
              <span class="ico" aria-hidden="true">
                <svg viewBox="0 0 24 24"
                  ><path
                    d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.93 6h-2.95a15.6 15.6 0 00-1.38-3.56A8.03 8.03 0 0118.92 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a7.96 7.96 0 010-4h3.38a16.6 16.6 0 000 4H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 015.08 16zm2.95-8H5.08a7.99 7.99 0 014.33-3.56A15.6 15.6 0 008.03 8zM12 19.96A13.7 13.7 0 0110.09 16h3.82A13.7 13.7 0 0112 19.96zM14.34 14H9.66a14.8 14.8 0 010-4h4.68a14.8 14.8 0 010 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 01-4.33 3.56zM16.36 14a16.6 16.6 0 000-4h3.38a7.96 7.96 0 010 4h-3.38z"
                  /></svg
                >
              </span>
              <span class="c-val">{link.label || link.url}</span>
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if hasSkills}
      <section class="side-sec">
        <h2 class="side-h">Skills</h2>
        {#each resume.skills as group}
          {#if group.category || group.items}
            <div class="skill-group">
              {#if group.category}<p class="skill-cat">{group.category}</p>{/if}
              {#if group.items}
                <ul class="skill-list">
                  {#each (group.items ?? "")
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean) as item}
                    <li>{item}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}
  </aside>

  <div class="main">
    <div class="avatar">
      {#if resume.basics.photo}
        <img src={resume.basics.photo} alt={fullName} />
      {:else}
        <span class="initials">{initials}</span>
      {/if}
    </div>

    {#if resume.summary}
      <section class="sec sec--summary">
        <h2 class="sec-h"><span class="marker"></span>Professional Summary</h2>
        <p class="summary">{resume.summary}</p>
      </section>
    {/if}

    {#if resume.experience.some((e) => e.title || e.company)}
      <section class="sec clear">
        <h2 class="sec-h"><span class="marker"></span>Work Experience</h2>
        {#each resume.experience as exp}
          {#if exp.title || exp.company}
            <div class="entry">
              <div class="row">
                <div class="role-line">
                  {#if exp.title}<span class="job">{exp.title}</span>{/if}{#if exp.company}<span
                      class="company">{#if exp.title} · {/if}{exp.company}</span
                    >{/if}
                </div>
                {#if exp.start || exp.end}
                  <span class="dates">{exp.start}{#if exp.end} – {exp.end}{/if}</span>
                {/if}
              </div>
              {#if exp.location}<div class="meta">{exp.location}</div>{/if}
              {#if (exp.bullets ?? []).some(Boolean)}
                <ul class="bullets">
                  {#each (exp.bullets ?? []).filter(Boolean) as bullet}<li>{bullet}</li>{/each}
                </ul>
              {/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}

    {#if resume.education.some((e) => e.school || e.degree || e.field)}
      <section class="sec clear">
        <h2 class="sec-h"><span class="marker"></span>Education</h2>
        {#each resume.education as edu}
          {#if edu.school || edu.degree || edu.field}
            <div class="entry">
              <div class="row">
                <div class="role-line">
                  {#if edu.degree || edu.field}
                    <span class="job"
                      >{edu.degree}{#if edu.degree && edu.field}, {/if}{edu.field}</span
                    >
                  {:else}
                    <span class="job">{edu.school}</span>
                  {/if}
                </div>
                {#if edu.graduation}<span class="dates">{edu.graduation}</span>{/if}
              </div>
              {#if edu.degree || edu.field}
                {#if edu.school}
                  <div class="meta meta--school"
                    >{edu.school}{#if edu.location} · {edu.location}{/if}</div
                  >
                {/if}
              {:else if edu.location}
                <div class="meta">{edu.location}</div>
              {/if}
              {#if edu.details}<p class="edu-details">{edu.details}</p>{/if}
            </div>
          {/if}
        {/each}
      </section>
    {/if}
  </div>
</article>

<style>
  .sheet {
    --navy: #1f3a5f;
    --navy-deep: #182d4a;
    --side-text: #c9d6e6;
    --side-rule: rgba(255, 255, 255, 0.16);
    --ink: #1f2a37;
    --muted: #5d6b7a;
    --accent: #a8c2e2;
    display: flex;
    align-items: stretch;
    background: #fff;
    color: var(--ink);
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.45;
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    margin: 0 auto;
  }

  /* ---------- Sidebar ---------- */
  .sidebar {
    flex: 0 0 34%;
    max-width: 34%;
    background: var(--navy);
    color: var(--side-text);
    box-sizing: border-box;
    padding: 14mm 9mm 14mm 10mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .id {
    padding-bottom: 7mm;
    margin-bottom: 7mm;
    border-bottom: 1px solid var(--side-rule);
  }
  .name {
    margin: 0;
    font-size: 21pt;
    font-weight: 800;
    line-height: 1.06;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #fff;
  }
  .role {
    margin: 7px 0 0;
    font-size: 8.4pt;
    font-weight: 600;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .side-sec {
    margin-top: 9mm;
  }
  .side-h {
    margin: 0 0 4mm;
    padding-bottom: 2.5mm;
    font-size: 10pt;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #fff;
    border-bottom: 1px solid var(--side-rule);
  }
  .contact {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .contact li {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 0 9px;
    font-size: 8.6pt;
    line-height: 1.3;
    word-break: break-word;
  }
  .contact li:last-child {
    margin-bottom: 0;
  }
  .ico {
    flex: 0 0 auto;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .ico svg {
    width: 10px;
    height: 10px;
    fill: #e3edf8;
  }
  .c-val {
    min-width: 0;
  }
  .skill-group {
    margin-bottom: 5mm;
  }
  .skill-group:last-child {
    margin-bottom: 0;
  }
  .skill-cat {
    margin: 0 0 2.5mm;
    font-size: 8.4pt;
    font-weight: 700;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--accent);
  }
  .skill-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .skill-list li {
    position: relative;
    padding-left: 12px;
    margin: 0 0 4px;
    font-size: 8.7pt;
    line-height: 1.32;
  }
  .skill-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.52em;
    width: 4px;
    height: 4px;
    background: var(--accent);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* ---------- Main column ---------- */
  .main {
    flex: 1 1 auto;
    min-width: 0;
    box-sizing: border-box;
    padding: 14mm 13mm 14mm 12mm;
  }
  .avatar {
    float: right;
    width: 28mm;
    height: 28mm;
    margin: 0 0 5mm 7mm;
    border-radius: 50%;
    overflow: hidden;
    border: 2.5px solid #e7edf4;
    box-shadow: 0 0 0 1px #d2dbe6;
    background: var(--navy);
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
    font-size: 17pt;
    font-weight: 700;
    letter-spacing: 1px;
    color: #fff;
  }
  .sec {
    margin-bottom: 7mm;
  }
  .sec:last-child {
    margin-bottom: 0;
  }
  .clear {
    clear: both;
  }
  .sec-h {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 3.5mm;
    font-size: 11pt;
    font-weight: 800;
    letter-spacing: 1.4px;
    text-transform: uppercase;
    color: var(--navy);
  }
  .marker {
    flex: 0 0 auto;
    width: 8px;
    height: 8px;
    background: var(--navy);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .summary {
    margin: 0;
    font-size: 9.7pt;
    line-height: 1.55;
    color: #34404e;
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
  .role-line {
    min-width: 0;
  }
  .job {
    font-size: 10.4pt;
    font-weight: 700;
    color: var(--ink);
  }
  .company {
    font-weight: 600;
    color: var(--navy);
  }
  .dates {
    flex: 0 0 auto;
    font-size: 8.6pt;
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
  }
  .meta {
    margin-top: 1px;
    font-size: 8.7pt;
    font-style: italic;
    color: var(--muted);
  }
  .meta--school {
    font-style: normal;
    font-weight: 500;
  }
  .bullets {
    margin: 2.5mm 0 0;
    padding-left: 0;
    list-style: none;
  }
  .bullets li {
    position: relative;
    padding-left: 14px;
    margin: 0 0 1.6mm;
    font-size: 9.5pt;
    line-height: 1.45;
    color: #34404e;
  }
  .bullets li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.5em;
    width: 4px;
    height: 4px;
    background: var(--navy);
    border-radius: 50%;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .edu-details {
    margin: 1.6mm 0 0;
    font-size: 9.3pt;
    line-height: 1.45;
    color: #34404e;
  }
</style>
