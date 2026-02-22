"use client";

/**
 * HighlightedText
 * Renders original message with suspicious phrases highlighted.
 * Clean government style.
 */
export default function HighlightedText({ text, highlights }) {
  if (!highlights || highlights.length === 0) {
    return (
      <div className="bg-white border border-gov-border rounded-lg p-5">
        <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-3">
          Original Message
        </h3>
        <p className="text-sm text-gov-text leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
    );
  }

  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const h of sorted) {
    if (merged.length === 0 || h.start >= merged[merged.length - 1].end) {
      merged.push(h);
    }
  }

  const segments = [];
  let cursor = 0;

  for (const h of merged) {
    if (h.start > cursor) {
      segments.push({ type: "plain", text: text.slice(cursor, h.start) });
    }
    segments.push({
      type: "highlight",
      text: text.slice(h.start, h.end),
      color: h.color,
      category: h.category,
    });
    cursor = h.end;
  }
  if (cursor < text.length) {
    segments.push({ type: "plain", text: text.slice(cursor) });
  }

  return (
    <div className="bg-white border border-gov-border rounded-lg p-5">
      <h3 className="text-xs font-semibold text-gov-text uppercase tracking-wider mb-3">
        Message Breakdown
      </h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.type === "plain" ? (
            <span key={i} className="text-gov-text">{seg.text}</span>
          ) : (
            <span
              key={i}
              title={seg.category}
              className="relative inline rounded px-0.5 cursor-help font-medium underline decoration-wavy decoration-1"
              style={{
                backgroundColor: `${seg.color}15`,
                color: seg.color,
                textDecorationColor: seg.color,
              }}
            >
              {seg.text}
            </span>
          )
        )}
      </p>

      {merged.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gov-border flex flex-wrap gap-2">
          {[...new Set(merged.map((h) => h.category))].map((cat) => {
            const color = merged.find((h) => h.category === cat)?.color;
            return (
              <span
                key={cat}
                className="text-[10px] font-medium px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${color}12`,
                  color: color,
                }}
              >
                {cat.replace(/_/g, " ")}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}