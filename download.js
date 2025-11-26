import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
const execAsync = promisify(exec);

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).end();

  try {
    const tmpDir = '/tmp';
    const filename = `video_${Date.now()}.mp4`;
    const filepath = path.join(tmpDir, filename);

    await execAsync(`yt-dlp -f "best[ext=mp4]" -o "${filepath}" "${url}"`, { timeout: 120000 });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'video/mp4');
    
    const stream = fs.createReadStream(filepath);
    stream.pipe(res);
    
    stream.on('end', () => fs.unlink(filepath, () => {}));
  } catch (e) {
    res.status(500).send('Erro no download');
  }
}