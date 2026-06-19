import formidable from 'formidable';
import { readFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const form = formidable({ uploadDir: tmpdir(), keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error al procesar archivo' });

    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' });

    const inputPath = file.filepath;

    try {
      const buffer = readFileSync(inputPath);
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default;
      const data = await pdfParse(buffer);
      const text = data.text;

      // Convertir texto a markdown básico
      const lines = text.split('\n');
      const result = [];
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) { result.push(''); continue; }
        result.push(trimmed);
      }
      const markdown = result.join('\n');

      try { unlinkSync(inputPath); } catch {}
      res.setHeader('Content-Type', 'text/markdown');
      res.send(markdown);
    } catch (e) {
      console.error(e);
      try { unlinkSync(inputPath); } catch {}
      res.status(500).json({ error: 'Error: ' + e.message });
    }
  });
}
