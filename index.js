const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
app.use(cors());
const upload = multer({ storage: multer.memoryStorage() });

// Configuración de variables de entorno
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
const FOLDER_ID = process.env.FOLDER_ID;

const authenticateGoogle = () => {
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );
  oAuth2Client.setCredentials({
    refresh_token: REFRESH_TOKEN
  });
  return google.drive({ version: 'v3', auth: oAuth2Client });
};

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).send('No file uploaded.');

    const drive = authenticateGoogle();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    const response = await drive.files.create({
      requestBody: { 
        name: req.file.originalname, 
        parents: [FOLDER_ID] 
      },
      media: { 
        mimeType: req.file.mimetype, 
        body: bufferStream 
      }
    });

    res.status(200).send({ message: 'Foto subida con éxito', fileId: response.data.id });
  } catch (error) {
    console.error('Error al subir:', error);
    res.status(500).send('Error interno del servidor');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor activo en puerto ${PORT}`));
