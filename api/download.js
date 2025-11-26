export default async function handler(req, res) {
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
    const response = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        vCodec: 'h264',
        vQuality: '720',
        aFormat: 'mp3',
        filenamePattern: 'basic',
        isAudioOnly: false
      })
    });

    const data = await response.json();

    if (data.status === 'redirect' || data.status === 'stream') {
      return res.status(200).json({
        success: true,
        downloadUrl: data.url
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Não foi possível processar o vídeo'
      });
    }
  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao processar vídeo'
    });
  }
}
