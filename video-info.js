const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

module.exports = async (req, res) => {
  // Permite CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  try {
    const command = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(command);
    const info = JSON.parse(stdout);
    
    res.status(200).json({
      success: true,
      title: info.title || 'Vídeo',
      thumbnail: info.thumbnail || null,
      duration: info.duration || 0,
      uploader: info.uploader || 'Desconhecido'
    });
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar vídeo',
      message: error.message 
    });
  }
};