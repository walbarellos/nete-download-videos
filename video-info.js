import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false });

  try {
    const { stdout } = await execAsync(`yt-dlp --dump-json --no-playlist "${url}"`, { timeout: 30000 });
    const info = JSON.parse(stdout);
    res.json({ 
      success: true, 
      title: info.title || 'Vídeo',
      duration: info.duration || 0
    });
  } catch (e) {
    res.status(400).json({ success: false });
  }
}