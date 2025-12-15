// Helper function to convert hex color to RGB
export const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
};

// Helper function to check if colors match (with tolerance)
export const colorMatches = (
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
  tolerance: number = 10,
): boolean => {
  return (
    Math.abs(r1 - r2) <= tolerance &&
    Math.abs(g1 - g2) <= tolerance &&
    Math.abs(b1 - b2) <= tolerance
  );
};

// Parse markdown-style formatting tags in text
export const parseFormattedText = (text: string) => {
  if (!text) return [];
  
  const parts: Array<{ text: string; bold?: boolean; italic?: boolean; strikethrough?: boolean; underline?: boolean }> = [];
  
  // Regex patterns for different formatting
  // Order matters: *** (bold+italic) before ** (bold) before * (italic)
  // Also handle ~ (strikethrough) and <u> (underline)
  const patterns = [
    { regex: /\*\*\*(.+?)\*\*\*/g, bold: true, italic: true }, // ***bold italic***
    { regex: /\*\*(.+?)\*\*/g, bold: true }, // **bold**
    { regex: /\*(.+?)\*/g, italic: true }, // *italic*
    { regex: /~~(.+?)~~/g, strikethrough: true }, // ~~strikethrough~~
    { regex: /<u>(.+?)<\/u>/g, underline: true }, // <u>underline</u>
  ];
  
  // Find all matches with their positions
  const matches: Array<{
    start: number;
    end: number;
    text: string;
    bold?: boolean;
    italic?: boolean;
    strikethrough?: boolean;
    underline?: boolean;
  }> = [];
  
  patterns.forEach((pattern) => {
    let match;
    const regex = new RegExp(pattern.regex.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        start: match.index,
        end: match.index + match[0].length,
        text: match[1],
        bold: pattern.bold,
        italic: pattern.italic,
        strikethrough: pattern.strikethrough,
        underline: pattern.underline,
      });
    }
  });
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Remove overlapping matches (keep the first one)
  const nonOverlapping: typeof matches = [];
  for (const match of matches) {
    const overlaps = nonOverlapping.some(
      (existing) =>
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end),
    );
    if (!overlaps) {
      nonOverlapping.push(match);
    }
  }
  
  // Build parts array
  let lastIndex = 0;
  nonOverlapping.forEach((match) => {
    // Add text before match
    if (match.start > lastIndex) {
      parts.push({ text: text.substring(lastIndex, match.start) });
    }
    // Add formatted text
    parts.push({
      text: match.text,
      bold: match.bold,
      italic: match.italic,
      strikethrough: match.strikethrough,
      underline: match.underline,
    });
    lastIndex = match.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ text: text.substring(lastIndex) });
  }
  
  return parts.length > 0 ? parts : [{ text }];
};

export const generateId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const defaultBaseSize = (asset: { type: 'image' | 'text' }) =>
  asset.type === 'text' ? { width: 260, height: 120 } : { width: 200, height: 260 };

