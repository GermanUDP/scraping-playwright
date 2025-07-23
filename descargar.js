const fs = require('fs');
const { google } = require('googleapis');

// Configuración
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];
const KEYFILE_PATH = 'credentials.json';
const SPREADSHEET_ID = '1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo';
const OUTPUT_FILE = 'matches.xlsx';

async function downloadSheet() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: SCOPES,
    });
    
    const authClient = await auth.getClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    const response = await drive.files.export({
      fileId: SPREADSHEET_ID,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }, { responseType: 'stream' });

    const writer = fs.createWriteStream(OUTPUT_FILE);
    response.data.pipe(writer);

    await new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
    
    console.log(`✅ Descarga completada: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('❌ Error al descargar:', error.message);
    if (error.response) {
      console.error('Detalles del error:', {
        status: error.response.status,
        data: error.response.data
      });
    }
  }
}

downloadSheet();
