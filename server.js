const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const execPromise = promisify(exec);
const app = express();
const PORT = 3000;

// Criar pasta para downloads temporários
const TEMP_DIR = path.join(__dirname, 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Endpoint para obter informações do vídeo
app.post('/api/video-info', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  try {
    // Obter informações do vídeo usando yt-dlp
    const command = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(command);
    const info = JSON.parse(stdout);

    res.json({
      success: true,
      title: info.title || 'Vídeo',
      thumbnail: info.thumbnail || null,
      duration: info.duration || 0,
      uploader: info.uploader || 'Desconhecido'
    });
  } catch (error) {
    console.error('Erro ao obter informações:', error.message);
    res.status(500).json({ 
      error: 'Erro ao processar vídeo',
      message: error.message 
    });
  }
});

// Endpoint para baixar o vídeo
app.get('/api/download', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  try {
    console.log('Iniciando download de:', url);

    // Obter informações primeiro
    const infoCommand = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(infoCommand);
    const info = JSON.parse(stdout);
    const title = (info.title || 'video').replace(/[^\w\s-]/g, '').substring(0, 100);
    const filename = `${Date.now()}_${title}.mp4`;
    const filepath = path.join(TEMP_DIR, filename);

    console.log('Baixando vídeo...');

    // Baixar vídeo para arquivo temporário (MUITO MAIS RÁPIDO)
    const downloadCommand = `yt-dlp -f "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio[ext=m4a]/best" --merge-output-format mp4 -o "${filepath}" "${url}"`;
    
    await execPromise(downloadCommand, { maxBuffer: 1024 * 1024 * 100 }); // 100MB buffer

    console.log('Download concluído, enviando arquivo...');

    // Enviar arquivo
    res.download(filepath, `${title}.mp4`, (err) => {
      // Deletar arquivo após envio
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        console.log('Arquivo temporário deletado');
      }
      if (err) {
        console.error('Erro ao enviar arquivo:', err);
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Erro ao processar download',
        message: error.message 
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`
🚀 Servidor rodando em http://localhost:${PORT}
📹 Baixador de vídeos pronto!
📁 Pasta temporária: ${TEMP_DIR}
  
Certifique-se de que o yt-dlp está instalado:
  Windows: winget install yt-dlp
  Linux/Mac: pip install yt-dlp

⚡ OTIMIZADO: Download rápido direto do servidor!
  `);
});