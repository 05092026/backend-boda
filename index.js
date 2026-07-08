const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

// CONFIGURACIÓN DE TU IDENTIDAD (TUS DATOS PERSONALES)
// En lugar de poner el código aquí, le decimos que lo busque "fuera"
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
      requestBody: { name: req.file.originalname, parents: [FOLDER_ID] },
      media: { mimeType: req.file.mimetype, body: bufferStream }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor listo en puerto ${PORT}`));
