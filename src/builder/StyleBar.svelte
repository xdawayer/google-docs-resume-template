<script lang="ts">
  import {
    FONT_OPTIONS,
    ACCENT_PRESETS,
    SCALE_MIN,
    SCALE_MAX,
    SCALE_STEP,
    LINE_MIN,
    LINE_MAX,
    LINE_STEP,
    type ResumeStyle,
  } from "./resume-style";

  let { style = $bindable() }: { style: ResumeStyle } = $props();

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

  const bumpScale = (d: number) => (style.scale = round2(clamp(style.scale + d, SCALE_MIN, SCALE_MAX)));
  const bumpLine = (d: number) =>
    (style.lineScale = round2(clamp(style.lineScale + d, LINE_MIN, LINE_MAX)));

  const pct = (n: number) => `${Math.round(n * 100)}%`;
</script>

<div class="stylebar" role="group" aria-label="Typography and color">
  <label class="ctl">
    <span class="lbl">Font</span>
    <select bind:value={style.font} aria-label="Font family">
      {#each FONT_OPTIONS as f}
        <option value={f.id}>{f.label}</option>
      {/each}
    </select>
  </label>

  <div class="ctl stepper" role="group" aria-label="Text size">
    <span class="lbl">Size</span>
    <button
      type="button"
      onclick={() => bumpScale(-SCALE_STEP)}
      disabled={style.scale <= SCALE_MIN}
      aria-label="Decrease text size">A−</button
    >
    <span class="val" aria-live="polite">{pct(style.scale)}</span>
    <button
      type="button"
      onclick={() => bumpScale(SCALE_STEP)}
      disabled={style.scale >= SCALE_MAX}
      aria-label="Increase text size">A+</button
    >
  </div>

  <div class="ctl stepper" role="group" aria-label="Line spacing">
    <span class="lbl">Spacing</span>
    <button
      type="button"
      onclick={() => bumpLine(-LINE_STEP)}
      disabled={style.lineScale <= LINE_MIN}
      aria-label="Decrease line spacing">−</button
    >
    <span class="val" aria-live="polite">{pct(style.lineScale)}</span>
    <button
      type="button"
      onclick={() => bumpLine(LINE_STEP)}
      disabled={style.lineScale >= LINE_MAX}
      aria-label="Increase line spacing">+</button
    >
  </div>

  <div class="ctl swatches" role="group" aria-label="Accent color">
    <span class="lbl">Color</span>
    {#each ACCENT_PRESETS as p}
      <button
        type="button"
        class="swatch"
        class:none={p.value === ""}
        class:active={style.accent === p.value}
        style={p.value ? `--sw:${p.value}` : ""}
        aria-label={p.label}
        aria-pressed={style.accent === p.value}
        title={p.label}
        onclick={() => (style.accent = p.value)}
      ></button>
    {/each}
  </div>
</div>

<style>
  .stylebar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
  }
  .ctl {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .lbl {
    font-size: 0.72rem;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  select {
    font: inherit;
    font-size: 0.82rem;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 6px;
    background: #fff;
    cursor: pointer;
  }
  .stepper button {
    width: 26px;
    height: 26px;
    border: 1px solid #ccc;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.8rem;
    line-height: 1;
    padding: 0;
  }
  .stepper button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .val {
    min-width: 36px;
    text-align: center;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    color: #374151;
  }
  .swatches {
    gap: 4px;
  }
  .swatch {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.18);
    background: var(--sw, #fff);
    cursor: pointer;
    padding: 0;
  }
  .swatch.none {
    background:
      linear-gradient(135deg, #fff 44%, #d33 45%, #d33 55%, #fff 56%);
  }
  .swatch.active {
    outline: 2px solid #111;
    outline-offset: 1px;
  }
  .swatch:focus-visible {
    outline: 2px solid #1a4fa0;
    outline-offset: 1px;
  }
</style>
