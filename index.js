const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const stream = require('stream');

const app = express();
// Permitimos que tu página web se comunique con este servidor sin bloqueos de seguridad
app.use(cors());

// Preparamos el sistema para recibir archivos directamente en la memoria (súper rápido)
const upload = multer({ storage: multer.memoryStorage() });

// Aquí está la dirección exacta de tu carpeta de la boda
const FOLDER_ID = '1jyWJgKtZvCHRP4TumB9w7J3jjcF1DuBH';

// Función para enseñar la llave y abrir la puerta de Google Drive
const authenticateGoogle = () => {
  // La llave la guardaremos en una "caja fuerte" oculta (variable de entorno) 
  // para que nadie en internet pueda verla en tu código.
  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  return google.drive({ version: 'v3', auth });
};

// Comprobación de que el servidor está despierto
app.get('/', (req, res) => {
  res.send('El servidor del repartidor está funcionando correctamente.');
});

// El proceso principal: recibir archivo y enviarlo a Drive
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('No se ha enviado ningún archivo.');
    }

    const drive = authenticateGoogle();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Subiendo a Google Drive...
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

    // Le decimos al móvil que todo ha salido bien
    res.status(200).json({ success: true, fileId: response.data.id });
  } catch (error) {
    console.error('Error al subir a Drive:', error);
    res.status(500).json({ success: false, error: 'Error al subir el archivo.' });
  }
});

// Encendiendo el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor listo en el puerto ${PORT}`);
});
