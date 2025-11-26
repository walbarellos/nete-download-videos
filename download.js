const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

module.exports = async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  try {
    const infoCommand = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(infoCommand);
    const info = JSON.parse(stdout);
    const title = (info.title || 'video').replace(/[^\w\s-]/g, '').substring(0, 100);

    const downloadCommand = `yt-dlp -f "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o - "${url}"`;
    
    const child = exec(downloadCommand, { maxBuffer: 1024 * 1024 * 100 });
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${title}.mp4"`);
    
    child.stdout.pipe(res);
    
    child.on('error', (error) => {
      console.error('Erro no download:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Erro ao baixar vídeo' });
      }
    });
  } catch (error) {
    console.error('Erro:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao processar download' });
    }
  }
};