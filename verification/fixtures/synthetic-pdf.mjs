// Minimal synthetic PDF writer for browser fixtures. Produces a one-or-more-page
// document whose pages carry a real Helvetica text layer (no external assets,
// no dependency). Every caller uses SYNTHETIC content only.
export function textPdf(linesPerPage) {
  const offsets = [];
  let body = '%PDF-1.4\n';
  const push = (s) => { offsets.push(body.length); body += s; };
  const n = linesPerPage.length;
  const fontId = 3 + n * 2;
  push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  push('2 0 obj\n<< /Type /Pages /Kids [' + linesPerPage.map((_, i) => `${3 + i * 2} 0 R`).join(' ') + `] /Count ${n} >>\nendobj\n`);
  const esc = s => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  for (let i = 0; i < n; i++) {
    const content = linesPerPage[i].map((t, j) => `BT /F1 14 Tf 72 ${720 - j * 24} Td (${esc(t)}) Tj ET`).join('\n');
    push(`${3 + i * 2} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${4 + i * 2} 0 R >>\nendobj\n`);
    push(`${4 + i * 2} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`);
  }
  push(`${fontId} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`);
  const xref = body.length;
  body += `xref\n0 ${fontId + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= fontId; i++) body += `${String(offsets[i - 1]).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${fontId + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(body, 'latin1');
}

// A structurally valid PDF whose single page has no text layer, like a scan.
export function blankPdf() {
  return textPdf([[]]);
}
