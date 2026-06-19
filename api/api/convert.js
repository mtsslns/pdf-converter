const formidable = require('formidable');
const fs = require('fs');
const os = require('os');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end('Method not allowed');

  const form = new formidable.IncomingForm({ 
    uploadDir: os.tmpdir(), 
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024
  });

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Error al procesar: ' + err.message });

    const file = Array.isArray(files.pdf) ? files.pdf[0] : files.pdf;
    if (!file) return res.status(400).json({ error: 'No se recibió archivo' });

    const inputPath = file.filepath || file.path;

    try {
      const pdfParse = require('pdf-parse');
      const buffer = fs.readFileSync(inputPath);
      const data = await pdfParse(buffer);
      
      try { fs.unlinkSync(inputPath); } catch {}
      
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      res.send(data.text);
    } catch (e) {
      console.error('Error:', e.message);
      try { fs.unlinkSync(inputPath); } catch {}
      res.status(500).json({ error: e.message });
    }
  });
};
