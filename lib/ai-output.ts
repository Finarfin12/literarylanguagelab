const TEXT_OUTPUT_RULES = `
Output formatting rules:
- Use simple Markdown only: short headings, bullet lists, bold labels, and short paragraphs.
- Do not use HTML tags.
- Do not use Markdown tables. Use bullet lists with bold labels instead.
- Do not wrap the answer in code fences.
- Keep the answer readable in a narrow sidebar.
`;

function isTableLine(line: string) {
  const trimmed = line.trim();
  return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.includes('|');
}

function isTableSeparator(line: string) {
  return /^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$/.test(line.trim());
}

function splitTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);
}

function tableToBullets(tableLines: string[]) {
  if (tableLines.length < 2) {
    return tableLines;
  }

  const hasHeader = isTableSeparator(tableLines[1]);
  const headers = hasHeader ? splitTableRow(tableLines[0]) : [];
  const rows = tableLines.slice(hasHeader ? 2 : 0).map(splitTableRow).filter((row) => row.length > 0);

  return rows.map((row) => {
    if (!headers.length) {
      return `- ${row.join(' - ')}`;
    }

    const [title, ...rest] = row;
    const details = rest
      .map((value, index) => {
        const label = headers[index + 1] || `Detail ${index + 1}`;
        return `**${label}:** ${value}`;
      })
      .join('; ');

    return details ? `- **${title}:** ${details}` : `- ${title}`;
  });
}

function convertTablesToBullets(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const output: string[] = [];

  for (let index = 0; index < lines.length; index++) {
    if (isTableLine(lines[index]) && lines[index + 1] && isTableSeparator(lines[index + 1])) {
      const tableLines = [lines[index], lines[index + 1]];
      index += 2;

      while (index < lines.length && isTableLine(lines[index])) {
        tableLines.push(lines[index]);
        index++;
      }

      output.push('', ...tableToBullets(tableLines), '');
      index--;
    } else {
      output.push(lines[index]);
    }
  }

  return output.join('\n');
}

export function withAITextOutputRules(systemPrompt: string) {
  return `${systemPrompt.trim()}\n\n${TEXT_OUTPUT_RULES.trim()}`;
}

export function formatAITextResponse(content: string) {
  const withoutCodeFences = content
    .trim()
    .replace(/^```(?:markdown|md|html)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^```(?:markdown|md|html)?\s*$/gim, '')
    .replace(/^```\s*$/gim, '');

  const withoutHtml = withoutCodeFences
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/?(?:p|div|span|strong|b|em|i|ul|ol|section|article|h[1-6])[^>]*>/gi, '');

  return convertTablesToBullets(withoutHtml)
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
