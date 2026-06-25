import type { NodeWithChildren } from "@/lib/curriculum-data";

export function buildDiscoverPrompt(
  node: NodeWithChildren,
  granularity: "topic" | "understanding",
  understandingCode?: string,
  understandingDescription?: string
): string {
  const context =
    granularity === "topic"
      ? `The topic is "${node.title}" from the NYS Regents Physical Setting/Chemistry curriculum (legacy 10-topic format). This is being taught at a specialized high school level (harder than standard Regents — deeper derivations, more rigorous problem solving, less rote memorization).`
      : `The specific concept is "${understandingCode}: ${understandingDescription}" from the "${node.title}" topic in NYS Regents Physical Setting/Chemistry (legacy format), taught at specialized high school honors level.`;

  return `You are helping curate an educational resource guide for high school chemistry students.

${context}

Search the web and find the best freely available resources for this. Return ONLY a JSON array, no other text, no markdown backticks. Each item in the array should have exactly these fields:
- url: the full URL
- title: the page/video title
- resource_type: one of "video", "text", "textbook", "problem_set", "reference_tool", "practice_exam", "other"
- source_domain: just the domain name (e.g. "jmap.org")
- ai_note: one sentence explaining why this resource is useful here specifically
- license_status: "cc_open" if you can confirm it's Creative Commons or openly licensed, otherwise "link_only"

Rules:
- Find 3-5 learning resources (explanations, videos, readings) AND 2-4 practice problem sources separately
- Prioritize: jmap.org, regentsprep.org, mrpalermo.com, openstax.org, ocw.mit.edu, khanacademy.org, chem.libretexts.org, ck12.org
- Only include resources that actually exist and are freely accessible
- Do not include resources that require login or payment
- Do not generate or summarize content yourself — only find real external URLs
- Be specific: a link to a specific page/video for this topic, not a homepage

Return only the JSON array.`;
}