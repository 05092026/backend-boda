const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');
const path = require('path');
require('dotenv').config();

const app = express();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 } 
});

const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

app.use(express.static('public'));

app.post('/upload', upload.single('archivo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No se ha subido ningún archivo.');
        }

        const fileMetadata = {
            name: req.file.originalname,
            parents: [process.env.DRIVE_FOLDER_ID] 
        };

        const media = {
            mimeType: req.file.mimetype,
            body: require('stream').Readable.from(req.file.buffer),
        };

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id',
        });

        res.status(200).send('Archivo subido con éxito a Drive.');
    } catch (error) {
        console.error('Error al subir:', error);
        res.status(500).send('Error al procesar la subida.');
    }
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Servidor activo en el puerto ${PORT}`);
});

server.timeout = 300000;
