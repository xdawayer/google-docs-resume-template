<script lang="ts">
  import type { Resume, TemplateId } from "./resume-schema";
  import { styleVarString, defaultStyle, type ResumeStyle } from "./resume-style";
  import AtsMinimal from "./templates/AtsMinimal.svelte";
  import Executive from "./templates/Executive.svelte";
  import ModernSidebar from "./templates/ModernSidebar.svelte";
  import Creative from "./templates/Creative.svelte";
  import FreshGraduate from "./templates/FreshGraduate.svelte";
  import Bold from "./templates/Bold.svelte";

  let {
    resume,
    template,
    style = defaultStyle(),
  }: { resume: Resume; template: TemplateId; style?: ResumeStyle } = $props();

  const components: Record<TemplateId, typeof AtsMinimal> = {
    "ats-minimal": AtsMinimal,
    executive: Executive,
    "modern-sidebar": ModernSidebar,
    creative: Creative,
    "fresh-graduate": FreshGraduate,
    bold: Bold,
  };
  const Comp = $derived(components[template]);

  // The chosen font/size/spacing/accent ride down as CSS custom properties that
  // each template reads with a fallback to its own value. `display: contents`
  // means this wrapper adds no box (no layout change) while still letting the
  // inherited properties reach the template root — including on print.
  const vars = $derived(styleVarString(style));
</script>

<div class="rb-style" style={vars}>
  <Comp {resume} />
</div>

<style>
  .rb-style {
    display: contents;
  }
</style>
