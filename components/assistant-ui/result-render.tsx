import { CircleCheckBig, CircleMinus, CircleX } from "lucide-react";
import { MarkdownTextImpl } from "./markdown-text";

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
      outers.push(text.slice(pos).trim());
      break;
    }

    // push outer chunk before the start marker
    outers.push(text.slice(pos, s).trim());

    // find end marker after start
    const e = text.indexOf(MARKER_END, s + MARKER_START.length);
    if (e === -1) {
      // no closing marker — treat the rest (including the start marker) as outer
      outers.push(text.slice(s).trim());
      break;
    }

    // extract inner content (trimmed)
    const inner = text.slice(s + MARKER_START.length, e).trim();
    inners.push(inner);

    // advance position after end marker
    pos = e + MARKER_END.length;
  }

  return {
    inners, // array of strings found between markers (in order)
    outers, // array of outer chunks (in order)
    outerText: outers.join(""), // full outer text (markers + inner removed)
  };
}

export default function ResultRender({ text }: { text: string }) {
  if (!text.includes(MARKER_END)) return <MarkdownTextImpl text={text} />;
  const { inners, outers, outerText } = extractOuterAndInner(text);
  const res = JSON.parse(inners[0]) as {
    answer: "yes" | "no" | "maybe";
    confidence: number;
    explaination: string;
  };
  console.log(res);
  console.log(outerText);
  const mp = {yes:"True","no":"False","maybe":"Maybe"}
  return (
    <div className="flex flex-col gap-2">
      <MarkdownTextImpl text={outerText} />
      <div className="w-fit rounded-lg bg-neutral-800 px-4 py-2 font-semibold">
        {res.explaination}
      </div>
      <div className="flex w-fit items-center gap-2 rounded-lg bg-neutral-800 px-4 py-2">
        <div className="flex items-center gap-2">
          <div>
          {res.answer == "yes" && <CircleCheckBig className="text-green-300" size={20}/>}
          {res.answer == "no" && <CircleX  className="text-red-500" size={20}/>}
          {res.answer == "maybe" && (
            <CircleMinus className="text-yellow-400" size={20}/>
          )}
          </div>
          <span className="font-semibold">
           {mp[res.answer]}
          </span>
          •
        </div>
        <span className="font-semibold">Confidence : {res.confidence}%</span>
      </div>
    </div>
  );
}
