const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');

// Configuración
const KEYFILE_PATH = 'credentials.json';
const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = '1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo';

// Mapeo de archivos Excel a hojas de destino
const ARCHIVOS_A_SUBIR = [
  {
    excel: 'resultados categorias digitales.xlsx',
    hojaDestino: 'Resultados CADS'
  },
  {
    excel: 'resultados electro hogar.xlsx',
    hojaDestino: 'Resultados Electro Hogar'
  },
  {
    excel: 'resultados softlines.xlsx',
    hojaDestino: 'Resultados Softlines'
  }
];

async function uploadExcelToSheets() {
  try {
    // Autenticación
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH,
      scopes: SCOPES,
    });
    const authClient = await auth.getClient();
    
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 1. Obtener información actual del spreadsheet
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets(properties(sheetId,title))'
    });

    // Procesar cada archivo Excel
    for (const {excel, hojaDestino} of ARCHIVOS_A_SUBIR) {
      if (!fs.existsSync(excel)) {
        console.warn(`⚠️ Archivo no encontrado: ${excel}`);
        continue;
      }

      console.log(`\n📤 Procesando ${excel} -> ${hojaDestino}`);

      // 2. Subir el archivo Excel a Drive temporalmente
      const fileMetadata = {
        name: 'temp_upload_' + Date.now() + '.xlsx',
        parents: ['root']
      };
      
      const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fs.createReadStream(excel)
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id'
      });

      console.log('✅ Archivo subido temporalmente a Drive');

      // 3. Convertir el Excel a Google Sheets
      const convertedFile = await drive.files.copy({
        fileId: uploadedFile.data.id,
        requestBody: {
          name: 'Temporal_convertido_' + Date.now(),
          mimeType: 'application/vnd.google-apps.spreadsheet'
        }
      });

      console.log('✅ Archivo convertido a Google Sheets');

      // 4. Obtener la primera hoja del archivo temporal
      const tempSheets = await sheets.spreadsheets.get({
        spreadsheetId: convertedFile.data.id,
        fields: 'sheets(properties(sheetId,title))'
      });

      const tempSheetId = tempSheets.data.sheets[0].properties.sheetId;
      const tempSheetTitle = tempSheets.data.sheets[0].properties.title;

      // 5. Buscar la hoja de destino en el spreadsheet principal
      const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === hojaDestino);

      if (targetSheet) {
        // 6a. Si existe la hoja: borrar y reemplazar
        console.log(`🔄 Reemplazando hoja existente: ${hojaDestino}`);
        
        // Eliminar la hoja existente
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              deleteSheet: {
                sheetId: targetSheet.properties.sheetId
              }
            }]
          }
        });
      } else {
        console.log(`🆕 Creando nueva hoja: ${hojaDestino}`);
      }

      // 6b. Copiar la hoja temporal al spreadsheet principal
      const copyResponse = await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId: convertedFile.data.id,
        sheetId: tempSheetId,
        requestBody: {
          destinationSpreadsheetId: SPREADSHEET_ID
        }
      });

      // 7. Renombrar la hoja copiada
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            updateSheetProperties: {
              properties: {
                sheetId: copyResponse.data.sheetId,
                title: hojaDestino
              },
              fields: 'title'
            }
          }]
        }
      });

      console.log(`✅ Datos actualizados en hoja: ${hojaDestino}`);

      // 8. Limpieza: eliminar archivos temporales
      await drive.files.delete({ fileId: uploadedFile.data.id });
      await drive.files.delete({ fileId: convertedFile.data.id });
    }

    console.log('\n🎉 Proceso completado exitosamente');
    console.log(`🔗 Accede a tu archivo aquí: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);

  } catch (error) {
    console.error('❌ Error en el proceso:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

uploadExcelToSheets();