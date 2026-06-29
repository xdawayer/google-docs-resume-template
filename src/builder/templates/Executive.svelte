<script lang="ts">
  import type { Resume } from "../resume-schema";
  let { resume }: { resume: Resume } = $props();

  type ContactItem = {
    kind: "location" | "phone" | "email" | "link";
    text: string;
  };

  const contactItems = $derived(
    [
      resume.basics.location
        ? { kind: "location", text: resume.basics.location }
        : null,
      resume.basics.phone
        ? { kind: "phone", text: resume.basics.phone }
        : null,
      resume.basics.email
        ? { kind: "email", text: resume.basics.email }
        : null,
      ...(resume.basics.links ?? []).map((l) =>
        l.url
          ? {
              kind: "link",
              text: (l.label || l.url).replace(/^https?:\/\//, "").replace(/\/$/, ""),
            }
          : null,
      ),
    ].filter(Boolean) as ContactItem[],
  );

  const initials = $derived(
    (resume.basics.fullName || "Your Name")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase(),
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
  {#snippet contactIcon(kind: ContactItem["kind"])}
    <svg class="ci" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      {#if kind === "location"}
        <path d="M12 21s6.5-6 6.5-10.5a6.5 6.5 0 0 0-13 0C5.5 15 12 21 12 21z" />
        <circle cx="12" cy="10.5" r="2.3" />
      {:else if kind === "phone"}
        <path d="M6.6 10.8a13 13 0 0 0 6.6 6.6l2.1-2.1a1 1 0 0 1 1-.24 11 11 0 0 0 3.4.55 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A16.5 16.5 0 0 1 3 4.5a1 1 0 0 1 1-1h3.4a1 1 0 0 1 1 1 11 11 0 0 0 .55 3.4 1 1 0 0 1-.24 1z" />
      {:else if kind === "email"}
        <rect x="3" y="5.5" width="18" height="13" rx="1.4" />
        <path d="M3.6 6.6 12 12.6l8.4-6" />
      {:else}
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3a14 14 0 0 1 0 18" />
        <path d="M12 3a14 14 0 0 0 0 18" />
      {/if}
    </svg>
  {/snippet}

  <header class="hdr">
    <div class="avatar">
      {#if resume.basics.photo}
        <img src={resume.basics.photo} alt={resume.basics.fullName || "Profile photo"} />
      {:else}
        <span class="monogram">{initials}</span>
      {/if}
    </div>

    <h1 class="name">{resume.basics.fullName || "Your Name"}</h1>
    {#if resume.basics.headline}
      <div class="role">{resume.basics.headline}</div>
    {/if}

    {#if contactItems.length}
      <div class="contact">
        {#each contactItems as item}
          <span class="ci-item">{@render contactIcon(item.kind)}<span>{item.text}</span></span>
        {/each}
      </div>
    {/if}
  </header>

  {#if resume.summary}
    <section>
      <h2>Executive Profile</h2>
      <p class="summary">{resume.summary}</p>
    </section>
  {/if}

  {#if resume.highlights.some(Boolean)}
    <section>
      <h2>Highlights</h2>
      <ul class="bullets">
        {#each resume.highlights.filter(Boolean) as h}<li>{h}</li>{/each}
      </ul>
    </section>
  {/if}

  {#if hasJobTarget}
    <section>
      <h2>Job Target</h2>
      {#if jt.title}<div class="ex-title">{jt.title}</div>{/if}
      {#if jobTargetMeta.length}
        <p class="ed-details">{jobTargetMeta.join(" · ")}</p>
      {/if}
    </section>
  {/if}

  {#if resume.experience.some((e) => e.title || e.company)}
    <section>
      <h2>Leadership Experience</h2>
      {#each resume.experience as exp}
        {#if exp.title || exp.company}
          <div class="entry">
            <div class="ex-head">
              <span class="ex-title">{exp.title || exp.company}</span>
              {#if exp.start || exp.end}
                <span class="ex-dates"
                  >{exp.start}{#if exp.start && exp.end} &ndash; {/if}{exp.end}</span
                >
              {/if}
            </div>
            {#if (exp.title && exp.company) || exp.location}
              <div class="ex-sub">
                {#if exp.title && exp.company}
                  <span class="ex-company">{exp.company}</span>
                {:else}
                  <span></span>
                {/if}
                {#if exp.location}<span class="ex-loc">{exp.location}</span>{/if}
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

  {#if resume.projects.some((p) => p.name || p.role)}
    <section>
      <h2>Projects</h2>
      {#each resume.projects as proj}
        {#if proj.name || proj.role}
          <div class="entry">
            <div class="ex-head">
              <span class="ex-title">{proj.name || proj.role}</span>
              {#if proj.start || proj.end}
                <span class="ex-dates"
                  >{proj.start}{#if proj.start && proj.end} &ndash; {/if}{proj.end}</span
                >
              {/if}
            </div>
            {#if proj.name && proj.role}
              <div class="ex-sub">
                <span class="ex-company">{proj.role}</span>
              </div>
            {/if}
            {#if proj.link}<p class="ed-details">{proj.link}</p>{/if}
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

  {#if resume.skills.some((s) => s.category || s.items)}
    <section>
      <h2>Core Competencies</h2>
      <div class="comp">
        {#each resume.skills as g}
          {#if g.category || g.items}
            <div class="comp-group">
              {#if g.category}<div class="comp-cat">{g.category}</div>{/if}
              {#if g.items}
                <ul class="comp-list">
                  {#each g.items.split(",").map((s) => s.trim()).filter(Boolean) as item}
                    <li>{item}</li>
                  {/each}
                </ul>
              {/if}
            </div>
          {/if}
        {/each}
      </div>
    </section>
  {/if}

  {#if resume.education.some((e) => e.school || e.degree)}
    <section>
      <h2>Education</h2>
      {#each resume.education as ed}
        {#if ed.school || ed.degree}
          <div class="entry">
            <div class="ex-head">
              <span class="ex-title ed-title"
                >{ed.degree}{#if ed.degree && ed.field}, {/if}{ed.field}{#if !ed.degree && !ed.field}{ed.school}{/if}</span
              >
              {#if ed.graduation}<span class="ex-dates">{ed.graduation}</span>{/if}
            </div>
            {#if ((ed.degree || ed.field) && ed.school) || ed.location}
              <div class="ex-sub">
                {#if (ed.degree || ed.field) && ed.school}
                  <span class="ex-company">{ed.school}</span>
                {:else}
                  <span></span>
                {/if}
                {#if ed.location}<span class="ex-loc">{ed.location}</span>{/if}
              </div>
            {/if}
            {#if ed.details}<p class="ed-details">{ed.details}</p>{/if}
          </div>
        {/if}
      {/each}
    </section>
  {/if}
</article>

<style>
  .sheet {
    --ink: #1b1b1b;
    --soft: #3f3f3f;
    --muted: #6f6f6f;
    --faint: #9a9a9a;
    --hair: #cdcdcd;
    --rule: var(--rb-accent, #aeaeae);
    --disc: #ededea;

    background: #fff;
    color: var(--ink);
    font-family: var(--rb-font, Georgia, "Times New Roman", Times, serif);
    font-size: calc(10pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    padding: 20mm 22mm 22mm;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  /* Header */
  .hdr {
    text-align: center;
    margin-bottom: 18px;
  }
  .avatar {
    width: 60px;
    height: 60px;
    margin: 0 auto 12px;
    border-radius: 50%;
    overflow: hidden;
    border: 1px solid var(--hair);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--disc);
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }
  .avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .monogram {
    font-size: calc(19pt * var(--rb-scale, 1));
    letter-spacing: 0.04em;
    color: var(--soft);
    font-weight: 400;
  }
  .name {
    margin: 0;
    font-size: calc(27pt * var(--rb-scale, 1));
    font-weight: 400;
    line-height: 1.05;
    letter-spacing: 0.17em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .role {
    margin-top: 7px;
    font-size: calc(9.5pt * var(--rb-scale, 1));
    font-weight: 400;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--soft);
  }
  .contact {
    margin-top: 13px;
    padding: 7px 0;
    border-top: 0.75px solid var(--hair);
    border-bottom: 0.75px solid var(--hair);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px 22px;
    font-size: calc(8.6pt * var(--rb-scale, 1));
    letter-spacing: 0.03em;
    color: var(--muted);
  }
  .ci-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }
  .ci {
    width: 11px;
    height: 11px;
    flex: none;
    color: var(--faint);
  }

  /* Sections */
  section {
    margin-top: 18px;
  }
  h2 {
    margin: 0 0 10px;
    padding-bottom: 5px;
    font-size: calc(11pt * var(--rb-scale, 1));
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--ink);
    border-bottom: 0.8px solid var(--rule);
  }
  .summary {
    margin: 0;
    line-height: calc(1.58 * var(--rb-line-scale, 1));
    color: var(--soft);
  }

  /* Entries */
  .entry {
    margin-bottom: 13px;
  }
  .entry:last-child {
    margin-bottom: 0;
  }
  .ex-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px;
  }
  .ex-title {
    font-weight: 700;
    font-size: calc(10.5pt * var(--rb-scale, 1));
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--ink);
  }
  .ed-title {
    text-transform: none;
    letter-spacing: 0.01em;
  }
  .ex-dates {
    font-size: calc(8.7pt * var(--rb-scale, 1));
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    white-space: nowrap;
  }
  .ex-sub {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 14px;
    margin-top: 2px;
    font-size: calc(9.4pt * var(--rb-scale, 1));
  }
  .ex-company {
    color: var(--soft);
  }
  .ex-loc {
    font-style: italic;
    color: var(--muted);
    white-space: nowrap;
  }
  .bullets {
    margin: 6px 0 0;
    padding-left: 16px;
  }
  .bullets li {
    margin: 3px 0;
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    color: var(--soft);
  }
  .bullets li::marker {
    color: var(--faint);
  }
  .ed-details {
    margin: 4px 0 0;
    font-size: calc(9.4pt * var(--rb-scale, 1));
    line-height: calc(1.5 * var(--rb-line-scale, 1));
    color: var(--soft);
  }

  /* Core Competencies — two-column list */
  .comp {
    column-count: 2;
    column-gap: 30px;
  }
  .comp-group {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    margin-bottom: 9px;
  }
  .comp-cat {
    font-weight: 700;
    font-size: calc(9pt * var(--rb-scale, 1));
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink);
    margin-bottom: 3px;
  }
  .comp-list {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .comp-list li {
    position: relative;
    padding-left: 13px;
    margin: 2px 0;
    font-size: calc(9.6pt * var(--rb-scale, 1));
    color: var(--soft);
    line-height: calc(1.4 * var(--rb-line-scale, 1));
  }
  .comp-list li::before {
    content: "\2013";
    position: absolute;
    left: 0;
    color: var(--faint);
  }

  @media print {
    .sheet {
      margin: 0;
      box-shadow: none;
    }
  }
</style>
