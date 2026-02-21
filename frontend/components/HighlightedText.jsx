"use client";

/**
 * HighlightedText
 * ----------------
 * Renders the original message with suspicious phrases highlighted
 * using the start/end indices and color provided by the backend.
 *
 * Props:
 *   text: string
 *   highlights: Array<{ phrase, category, color, start, end }>
 */
export default function HighlightedText({ text, highlights }) {
  if (!highlights || highlights.length === 0) {
    return (
      <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
          Message Text
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
          {text}
        </p>
      </div>
    );
  }

  // Sort highlights by start index and remove overlaps
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const merged = [];
  for (const h of sorted) {
    if (merged.length === 0) {
      merged.push(h);
    } else {
      const last = merged[merged.length - 1];
      if (h.start >= last.end) {
        merged.push(h);
      }
      // skip overlapping highlights (keep the first one)
    }
  }

  // Build segments: alternating plain text and highlighted spans
  const segments = [];
  let cursor = 0;

  for (const h of merged) {
    // Plain text before this highlight
    if (h.start > cursor) {
      segments.push({
        type: "plain",
        text: text.slice(cursor, h.start),
      });
    }

    // Highlighted span
    segments.push({
      type: "highlight",
      text: text.slice(h.start, h.end),
      color: h.color,
      category: h.category,
    });

    cursor = h.end;
  }

  // Remaining plain text
  if (cursor < text.length) {
    segments.push({
      type: "plain",
      text: text.slice(cursor),
    });
  }

  return (
    <div className="bg-suraksha-card border border-suraksha-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">
        Message Analysis
      </h3>
      <p className="text-sm leading-relaxed whitespace-pre-wrap">
        {segments.map((seg, i) =>
          seg.type === "plain" ? (
            <span key={i} className="text-gray-300">
              {seg.text}
            </span>
          ) : (
            <span
              key={i}
              title={seg.category}
              className="relative inline-block rounded px-0.5 py-0.5 cursor-help font-medium"
              style={{
                backgroundColor: `${seg.color}22`,
                color: seg.color,
                borderBottom: `2px solid ${seg.color}`,
              }}
            >
              {seg.text}
            </span>
          )
        )}
      </p>

      {/* Legend */}
      {merged.length > 0 && (
        <div className="mt-4 pt-3 border-t border-suraksha-border flex flex-wrap gap-2">
          {[...new Set(merged.map((h) => h.category))].map((cat) => {
            const color = merged.find((h) => h.category === cat)?.color;
            return (
              <span
                key={cat}
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${color}22`,
                  color: color,
                }}
              >
                {cat}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}