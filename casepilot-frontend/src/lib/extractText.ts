/**
 * Best-effort text extraction from uploaded files.
 * - PDF  → pdfjs-dist (all pages concatenated)
 * - DOCX → mammoth
 * - TXT  → File.text()
 * - Other (images, etc.) → empty string; the AI gracefully handles missing text.
 *
 * Never throws — returns '' on any failure so upload is never blocked.
 */

export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();

  try {
    if (name.endsWith('.pdf') || mime === 'application/pdf') {
      return await extractFromPdf(file);
    }

    if (
      name.endsWith('.docx') ||
      mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      return await extractFromDocx(file);
    }

    if (name.endsWith('.doc') || mime === 'application/msword') {
      return await extractFromDocx(file);
    }

    if (name.endsWith('.txt') || mime.startsWith('text/')) {
      return await file.text();
    }
  } catch (err) {
    console.warn('[extractText] extraction failed, proceeding without text:', err);
  }

  return '';
}

async function extractFromPdf(file: File): Promise<string> {
  // Lazy import to avoid loading the heavy library unless needed
  const pdfjsLib = await import('pdfjs-dist');

  // Set worker source using Vite's URL resolution
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item) => ('str' in item ? (item as { str: string }).str : ''))
      .join(' ');
    pages.push(pageText);
  }

  return pages.join('\n').trim();
}

async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value.trim();
}
