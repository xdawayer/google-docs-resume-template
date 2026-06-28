<script lang="ts">
  import {
    type Resume,
    type Experience,
    emptyExperience,
    emptyEducation,
    emptySkillGroup,
  } from "./resume-schema";

  let { resume = $bindable() }: { resume: Resume } = $props();

  const addLink = () => resume.basics.links.push({ label: "", url: "" });
  const removeLink = (i: number) => resume.basics.links.splice(i, 1);

  const addExperience = () => resume.experience.push(emptyExperience());
  const removeExperience = (i: number) => resume.experience.splice(i, 1);
  const addBullet = (exp: Experience) => exp.bullets.push("");
  const removeBullet = (exp: Experience, j: number) => exp.bullets.splice(j, 1);

  const addEducation = () => resume.education.push(emptyEducation());
  const removeEducation = (i: number) => resume.education.splice(i, 1);

  const addSkill = () => resume.skills.push(emptySkillGroup());
  const removeSkill = (i: number) => resume.skills.splice(i, 1);
</script>

<form class="form" onsubmit={(e) => e.preventDefault()}>
  <fieldset>
    <legend>Basics</legend>
    <label>Full name<input bind:value={resume.basics.fullName} placeholder="Your Name" /></label>
    <label>Headline / target role<input bind:value={resume.basics.headline} placeholder="Senior Software Engineer" /></label>
    <div class="grid">
      <label>Email<input bind:value={resume.basics.email} type="email" /></label>
      <label>Phone<input bind:value={resume.basics.phone} /></label>
    </div>
    <label>Location<input bind:value={resume.basics.location} placeholder="City, State" /></label>
    <div class="rows">
      {#each resume.basics.links as link, i}
        <div class="row">
          <input bind:value={link.label} placeholder="LinkedIn" class="w-30" />
          <input bind:value={link.url} placeholder="linkedin.com/in/you" />
          <button type="button" class="del" onclick={() => removeLink(i)} aria-label="Remove link">×</button>
        </div>
      {/each}
      <button type="button" class="add" onclick={addLink}>+ Add link</button>
    </div>
  </fieldset>

  <fieldset>
    <legend>Summary</legend>
    <textarea bind:value={resume.summary} rows="3" placeholder="One or two lines on your target role and strongest result."></textarea>
  </fieldset>

  <fieldset>
    <legend>Experience</legend>
    {#each resume.experience as exp, i}
      <div class="item">
        <div class="grid">
          <label>Title<input bind:value={exp.title} /></label>
          <label>Company<input bind:value={exp.company} /></label>
        </div>
        <div class="grid">
          <label>Location<input bind:value={exp.location} /></label>
          <div class="grid">
            <label>Start<input bind:value={exp.start} placeholder="2022" /></label>
            <label>End<input bind:value={exp.end} placeholder="Present" /></label>
          </div>
        </div>
        <div class="bullets">
          <span class="sub">Bullets</span>
          {#each exp.bullets as _, j}
            <div class="row">
              <input bind:value={exp.bullets[j]} placeholder="Lead with a measurable outcome." />
              <button type="button" class="del" onclick={() => removeBullet(exp, j)} aria-label="Remove bullet">×</button>
            </div>
          {/each}
          <button type="button" class="add" onclick={() => addBullet(exp)}>+ Add bullet</button>
        </div>
        <button type="button" class="remove" onclick={() => removeExperience(i)}>Remove role</button>
      </div>
    {/each}
    <button type="button" class="add" onclick={addExperience}>+ Add role</button>
  </fieldset>

  <fieldset>
    <legend>Education</legend>
    {#each resume.education as ed, i}
      <div class="item">
        <div class="grid">
          <label>School<input bind:value={ed.school} /></label>
          <label>Graduation<input bind:value={ed.graduation} placeholder="2019" /></label>
        </div>
        <div class="grid">
          <label>Degree<input bind:value={ed.degree} placeholder="B.S." /></label>
          <label>Field<input bind:value={ed.field} placeholder="Computer Science" /></label>
        </div>
        <label>Location<input bind:value={ed.location} /></label>
        <button type="button" class="remove" onclick={() => removeEducation(i)}>Remove</button>
      </div>
    {/each}
    <button type="button" class="add" onclick={addEducation}>+ Add education</button>
  </fieldset>

  <fieldset>
    <legend>Skills</legend>
    {#each resume.skills as group, i}
      <div class="row">
        <input bind:value={group.category} placeholder="Languages" class="w-30" />
        <input bind:value={group.items} placeholder="TypeScript, Go, SQL" />
        <button type="button" class="del" onclick={() => removeSkill(i)} aria-label="Remove skill group">×</button>
      </div>
    {/each}
    <button type="button" class="add" onclick={addSkill}>+ Add skill group</button>
  </fieldset>
</form>

<style>
  .form {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  fieldset {
    border: 1px solid #e3e3e6;
    border-radius: 8px;
    padding: 12px 14px;
  }
  legend {
    font-weight: 600;
    padding: 0 6px;
  }
  label {
    display: flex;
    flex-direction: column;
    font-size: 0.8rem;
    color: #444;
    gap: 3px;
    margin-bottom: 8px;
  }
  input,
  textarea {
    font: inherit;
    font-size: 0.9rem;
    padding: 6px 8px;
    border: 1px solid #ccc;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .rows,
  .bullets {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: center;
  }
  .w-30 {
    max-width: 30%;
  }
  .item {
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 10px;
    margin-bottom: 10px;
  }
  .sub {
    font-size: 0.75rem;
    color: #666;
  }
  .add {
    align-self: flex-start;
    background: none;
    border: 1px dashed #aaa;
    border-radius: 6px;
    padding: 4px 10px;
    cursor: pointer;
    font-size: 0.8rem;
  }
  .remove {
    background: none;
    border: none;
    color: #b00020;
    cursor: pointer;
    font-size: 0.78rem;
    padding: 4px 0 0;
  }
  .del {
    background: none;
    border: 1px solid #ddd;
    border-radius: 6px;
    width: 28px;
    height: 28px;
    cursor: pointer;
    flex: none;
  }
</style>
