const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json()); 

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const FOLDER_ID = process.env.FOLDER_ID;

const authenticateGoogle = () => {
  const oAuth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  oAuth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });
  return oAuth2Client;
};

// El portero saluda a cron-job para que no marque error
app.get('/', (req, res) => {
  res.status(200).send('El portero está despierto y listo para la boda.');
});

app.post('/get-upload-link', async (req, res) => {
  try {
    const { fileName, mimeType } = req.body;

    if (!fileName || !mimeType) {
      return res.status(400).send('Faltan datos del archivo.');
    }

    const authClient = authenticateGoogle();
    const { token } = await authClient.getAccessToken();

    const origin = req.headers.origin || '*';

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': mimeType,
        'Origin': origin 
      },
      body: JSON.stringify({
        name: fileName,
        parents: [FOLDER_ID]
      })
    });

    const uploadUrl = response.headers.get('location');

    if (!uploadUrl) {
      throw new Error('No se pudo generar el enlace de Google Drive');
    }

    res.status(200).json({ uploadUrl });
    
  } catch (error) {
    console.error('Error al generar el enlace:', error);
    res.status(500).send('Error interno del servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
