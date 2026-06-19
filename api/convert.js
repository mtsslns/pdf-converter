import { IncomingForm } from 'formidable';
import { execSync } from 'child_process';
import { readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const form = new IncomingForm({ uploadDir: tmpdir(), keepExtensions: true });

  form.parse(req, (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error al procesar archivo' });

    const file = files.pdf?.[0] || files.pdf;
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' });

    const inputPath = file.filepath || file.path;
    const outputPath = join(tmpdir(), `output_${Date.now()}.md`);

    try {
      execSync(`python3 -m markitdown "${inputPath}" -o "${outputPath}"`, { timeout: 60000 });
      const content = readFileSync(outputPath, 'utf-8');
      unlinkSync(inputPath);
      unlinkSync(outputPath);
      res.setHeader('Content-Type', 'text/markdown');
      res.send(content);
    } catch (e) {
      res.status(500).json({ error: 'Error en la conversión' });
    }
  });
}
