<script lang="ts">
  import type { Resume, TemplateId } from "./resume-schema";
  import AtsMinimal from "./templates/AtsMinimal.svelte";
  import Executive from "./templates/Executive.svelte";
  import ModernSidebar from "./templates/ModernSidebar.svelte";
  import Creative from "./templates/Creative.svelte";
  import FreshGraduate from "./templates/FreshGraduate.svelte";
  import Bold from "./templates/Bold.svelte";

  let { resume, template }: { resume: Resume; template: TemplateId } = $props();

  const components: Record<TemplateId, typeof AtsMinimal> = {
    "ats-minimal": AtsMinimal,
    executive: Executive,
    "modern-sidebar": ModernSidebar,
    creative: Creative,
    "fresh-graduate": FreshGraduate,
    bold: Bold,
  };
  const Comp = $derived(components[template]);
</script>

<Comp {resume} />
