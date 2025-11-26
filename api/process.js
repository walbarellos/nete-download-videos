const { exec } = require('child_process');
const { promisify } = require('util');
const execPromise = promisify(exec);

function cleanUrl(url) {
  if (!url.startsWith('http')) url = 'https://' + url;
  url = url.split('&list=')[0].split('?list=')[0];
  return url;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL não fornecida' });
  }

  url = cleanUrl(url);

  try {
    const infoCommand = `yt-dlp --dump-json --no-playlist "${url}"`;
    const { stdout } = await execPromise(infoCommand, { timeout: 15000 });
    const info = JSON.parse(stdout);

    res.json({ success: true, title: info.title });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
