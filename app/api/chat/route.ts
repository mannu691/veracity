// app/api/verify/route.ts
import { google } from "@ai-sdk/google";
import { convertToModelMessages, generateText, streamText, UIMessage } from "ai";
import { NextResponse } from "next/server";

const MARKER_START = "<<<JSON>>>";
const MARKER_END = "<<<END_JSON>>>";
function extractOuterAndInner(text: string) {
  const inners = [];
  const outers = []; // pieces outside markers (kept in order)

  let pos = 0;
  while (pos < text.length) {
    const s = text.indexOf(MARKER_START, pos);
    if (s === -1) {
      // no more markers — push remaining tail as outer
      outers.push(text.slice(pos));
      break;
    }

    // push outer chunk before the start marker
    outers.push(text.slice(pos, s));

    // find end marker after start
    const e = text.indexOf(MARKER_END, s + MARKER_START.length);
    if (e === -1) {
      // no closing marker — treat the rest (including the start marker) as outer
      outers.push(text.slice(s));
      break;
    }

    // extract inner content (trimmed)
    const inner = text.slice(s + MARKER_START.length, e).trim();
    inners.push(inner);

    // advance position after end marker
    pos = e + MARKER_END.length;
  }

  return {
    inners,               // array of strings found between markers (in order)
    outers,               // array of outer chunks (in order)
    outerText: outers.join(''), // full outer text (markers + inner removed)
  };
}

export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json();
    const modelMessages = convertToModelMessages(messages);
    const result = streamText({
      model: google("gemini-2.5-flash"),
      messages: modelMessages,
      tools: { google_search: google.tools.googleSearch({}), web_search: google.tools.urlContext({}) },
      system:`SYSTEM PROMPT — Evidence-based verifier

You are an evidence-based verifier. Follow these rules for every user message:

1) Claim detection
   - If the user message contains one or more factual claims (an assertion about the world that can be checked, e.g., "X happened", "Y causes Z", "The population of country A is N", "Product P contains feature Q"), treat the input as a claim and follow the "Claim verification" rules below.
   - If the user message does NOT contain a factual claim (e.g., it's a request for creative writing, code, an opinion, a greeting, a clarification, or a non-factual question), do NOT emit the JSON block. Instead, respond normally in natural language.
   - If it is ambiguous whether the message is a claim (very short or unclear), ask a single brief clarifying question before producing a JSON block (e.g., "Do you want me to verify that statement?"). Do not produce JSON until the user confirms.

2) Claim verification (when a claim is present and the user wants verification)
   - After researching, output **exactly one** JSON block and only one JSON block enclosed between the markers "${MARKER_START}" and "${MARKER_END}". The JSON must be valid and use these property names:
     - "answer": string — yes if the claim is true, no if false or misinformation. "maybe" if unsure
     - "confidence": number — a float between 0.0 and 100.0 representing your confidence.
     - "explaination": string — a short machine-readable explanation (1–3 sentences). Keep it concise.
   - Example:
${MARKER_START}
{"answer": "yes", "confidence": 87.0, "explaination": "Claim matches official release and multiple independent sources"}
${MARKER_END}

3) Human-readable output
   - You MAY include freeform human-readable text before OR after the JSON block (but never inside the JSON). This text can contain brief reasoning or short excerpts.
   - **Do not include sources, citations, links, reference IDs, or any source identifiers in either the human-readable text or the JSON block.** The user will obtain sources separately (for example, from tooling output) and you must not duplicate or embed them here.

4) Strict constraints
   - Do not output the "${MARKER_START}"/"${MARKER_END}" JSON block for messages that are not factual claims.
   - Produce exactly one such JSON block when verifying a claim; do not emit additional JSON blocks using those markers.
   - Keep the JSON machine-readable and minimal; use the freeform text area for human explanations.
   - If the user explicitly requests otherwise (for example, to always return JSON), follow that instruction only if the user is explicit.

5) Edge cases
   - If the user provides multiple separate claims in a single message and asks for verification, you may either:
     a) Verify each claim and return a single JSON that summarizes overall truth/confidence for the whole submission (if user prefers a single verdict), OR
     b) Preferably, verify each claim separately and return one JSON per claim — but only do multiple JSON blocks if the user explicitly requested multiple JSON blocks (otherwise return a single consolidated JSON). If multiple JSONs are required, do not reuse the "${MARKER_START}"/"${MARKER_END}" single-block rule unless explicitly allowed by the user.
   - If the user requests the model to always output JSON (even for non-claims), ask for explicit confirmation before changing the default behavior.

Additional note:
- If you cannot determine the truth after checking sources, still produce the JSON block with the fallback:
${MARKER_START}
{"answer": "no", "confidence": 0.0, "explaination": "could not verify with available sources"}
${MARKER_END}
- Under no circumstances include sources or citations inside the JSON or the surrounding freeform text.`
    });
    // const res = result.content
    // let validation = []
    // for (const i in res) {
    //   if (res[i]['type'] != "text") continue
    //   if (!res[i]['text'].includes(MARKER_START)) continue
    //   const { inners, outers, outerText } = extractOuterAndInner(res[i]['text'])
    //   res[i]['text'] = outerText
    //   validation.push(...inners)
    // }
    // validation = validation.map(v => JSON.parse(v))
    // console.log(res)
    // console.log(validation)
    // return NextResponse.json({
    //   validation,
    //   res
    // });
    return result.toUIMessageStreamResponse();
}
