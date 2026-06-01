/**
 * Generates a .docx file from AI-generated text and triggers a browser download.
 * Uses the `docx` library (no server round-trip needed).
 */
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun
} from 'docx';
import { saveAs } from 'file-saver';

/**
 * Creates a .docx blob from the given title + body text.
 * Splits content on newlines and creates a paragraph per non-empty line.
 */
export async function generateDocxBlob(title: string, content: string): Promise<Blob> {
  const lines = content.split('\n');

  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 }
    }),
    ...lines.map(
      (line) =>
        new Paragraph({
          children: [
            new TextRun({
              text: line,
              size: 24, // 12pt
              font: 'Times New Roman'
            })
          ],
          spacing: { after: 160 }
        })
    )
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  });

  return Packer.toBlob(doc);
}

/**
 * Generates and immediately downloads a .docx file.
 */
export async function downloadDocx(
  title: string,
  content: string,
  filename: string
): Promise<void> {
  const blob = await generateDocxBlob(title, content);
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}
