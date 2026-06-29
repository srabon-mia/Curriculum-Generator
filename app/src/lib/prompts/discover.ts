import type { NodeWithChildren } from "@/lib/curriculum-data";

export function buildDiscoverPrompt(
  node: NodeWithChildren,
  granularity: "topic" | "understanding",
  understandingCode?: string,
  understandingDescription?: string,
  curriculumTitle?: string
): string {
  const courseContext = curriculumTitle ?? "the course";
  
  const context =
    granularity === "topic"
      ? `The topic is "${node.title}" from the course "${courseContext}". Resources must be specifically about this topic in the context of ${courseContext}.`
      : `The specific concept is "${understandingCode}: ${understandingDescription}" from the "${node.title}" topic in "${courseContext}".`;

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

export function buildTopicBatchPrompt(
  node: NodeWithChildren,
  curriculumTitle: string
): string {
  const understandings = node.major_understandings
    .map((mu) => `- ${mu.code ?? mu.external_key}: ${mu.description}`)
    .join("\n");

  return `You are helping curate an educational resource guide for students.

The course is: "${curriculumTitle}"
The topic within that course is: "${node.title}"

Here are the specific concepts students need to understand within this topic:
${understandings}

Search the web and find the best freely available resources for EACH concept listed above. Make sure resources are specifically about "${node.title}" in the context of "${curriculumTitle}" — not just any resource that matches the topic name.

Return ONLY a JSON object, no other text, no markdown backticks:
{
  "topic_resources": [
    {
      "url": "...",
      "title": "...",
      "resource_type": "video|text|textbook|problem_set|reference_tool|practice_exam|other",
      "source_domain": "...",
      "ai_note": "one sentence why this is useful",
      "license_status": "cc_open|link_only",
      "understanding_codes": ["1.1", "1.2"]
    }
  ]
}

Rules:
- Find 8-12 resources total that collectively cover all the concepts
- Each resource should list which understanding codes it covers in understanding_codes
- If a resource covers the whole topic generally, list all codes
- Only freely accessible resources, no login or payment required
- Return only the JSON object`;
}