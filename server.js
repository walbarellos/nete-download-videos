const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const { promisify } = require('util');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const execPromise = promisify(exec);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Função pra limpar a URL
function cleanUrl(url) {
  // Adiciona https:// se não tiver
  if (!url.startsWith('http')) {
    url = 'https://' + url;
  }
  
  // Remove parâmetros de playlist
  url = url.split('&list=')[0];
  url = url.split('?list=')[0];
  
  return url;
}

app.post('/api/process', async (req, res) => {
  let { url } = req.body;
  
  console.log('=== VALIDANDO URL ===');
  console.log('URL original:', url);
  
  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  url = cleanUrl(url);
  console.log('URL limpa:', url);

  try {
    console.log('Verificando se o vídeo existe...');
    const infoCommand = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(infoCommand, { timeout: 15000 });
    const info = JSON.parse(stdout);
    
    console.log('Vídeo encontrado:', info.title);
    res.json({ success: true, title: info.title });
  } catch (error) {
    console.error('ERRO:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/download', (req, res) => {
  let { url } = req.query;
  
  console.log('=== DOWNLOAD DIRETO ===');
  console.log('URL original:', url);
  
  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  url = cleanUrl(url);
  console.log('URL limpa:', url);

  res.setHeader('Content-Type', 'video/mp4');
  res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');

  console.log('Iniciando stream do vídeo...');
  
  const ytdlp = spawn('yt-dlp', [
    '-f', 'best[ext=mp4]',
    '--no-playlist',
    '-o', '-',
    url
  ]);

  ytdlp.stdout.pipe(res);

  ytdlp.stderr.on('data', (data) => {
    console.log('yt-dlp:', data.toString());
  });

  ytdlp.on('close', (code) => {
    console.log('Download finalizado com código:', code);
  });

  ytdlp.on('error', (error) => {
    console.error('Erro no yt-dlp:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Erro ao baixar vídeo' });
    }
  });

  req.on('close', () => {
    console.log('Cliente desconectou');
    ytdlp.kill();
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});