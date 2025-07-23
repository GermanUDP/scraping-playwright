// Importación de módulos necesarios
const fs = require('fs'); // Módulo para manejo de archivos
const { google } = require('googleapis'); // API de Google
const path = require('path'); // Utilidades para manejo de rutas

// ==============================================
// CONFIGURACIÓN INICIAL
// ==============================================
const KEYFILE_PATH = 'credentials.json'; // Ruta al archivo de credenciales
const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets'
];
const SPREADSHEET_ID = '1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo'; // ID del documento destino

// Mapeo de archivos Excel y sus hojas de destino correspondientes
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

// ==============================================
// FUNCIÓN PRINCIPAL
// ==============================================
async function uploadExcelToSheets() {
  try {
    // ------------------------------------------
    // 1. AUTENTICACIÓN CON GOOGLE APIs
    // ------------------------------------------
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH, // Archivo de credenciales
      scopes: SCOPES, // Permisos requeridos
    });
    const authClient = await auth.getClient(); // Cliente autenticado
    
    // Inicialización de servicios
    const drive = google.drive({ version: 'v3', auth: authClient });
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // ------------------------------------------
    // 2. OBTENER INFORMACIÓN DEL SPREADSHEET DESTINO
    // ------------------------------------------
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets(properties(sheetId,title))' // Solo solicitamos los datos necesarios
    });

    // ------------------------------------------
    // 3. PROCESAR CADA ARCHIVO EXCEL
    // ------------------------------------------
    for (const {excel, hojaDestino} of ARCHIVOS_A_SUBIR) {
      // Verificar existencia del archivo local
      if (!fs.existsSync(excel)) {
        console.warn(`⚠️ Archivo no encontrado: ${excel}`);
        continue; // Saltar a la siguiente iteración
      }

      console.log(`\n📤 Procesando ${excel} -> ${hojaDestino}`);

      // ------------------------------------------
      // 4. SUBIR ARCHIVO EXCEL A DRIVE (TEMPORAL)
      // ------------------------------------------
      const fileMetadata = {
        name: 'temp_upload_' + Date.now() + '.xlsx', // Nombre único
        parents: ['root'] // Carpeta raíz de Drive
      };
      
      const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fs.createReadStream(excel) // Stream del archivo
      };

      const uploadedFile = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id' // Solo necesitamos el ID de respuesta
      });

      console.log('✅ Archivo subido temporalmente a Drive');

      // ------------------------------------------
      // 5. CONVERTIR ARCHIVO A GOOGLE SHEETS
      // ------------------------------------------
      const convertedFile = await drive.files.copy({
        fileId: uploadedFile.data.id, // ID del archivo subido
        requestBody: {
          name: 'Temporal_convertido_' + Date.now(),
          mimeType: 'application/vnd.google-apps.spreadsheet' // Tipo de conversión
        }
      });

      console.log('✅ Archivo convertido a Google Sheets');

      // ------------------------------------------
      // 6. OBTENER DATOS DE LA HOJA TEMPORAL
      // ------------------------------------------
      const tempSheets = await sheets.spreadsheets.get({
        spreadsheetId: convertedFile.data.id,
        fields: 'sheets(properties(sheetId,title))' // Solo datos de hojas
      });

      const tempSheetId = tempSheets.data.sheets[0].properties.sheetId;
      const tempSheetTitle = tempSheets.data.sheets[0].properties.title;

      // ------------------------------------------
      // 7. BUSCAR HOJA DE DESTINO EN EL ARCHIVO PRINCIPAL
      // ------------------------------------------
      const targetSheet = spreadsheet.data.sheets.find(s => s.properties.title === hojaDestino);

      if (targetSheet) {
        // ------------------------------------------
        // 8a. SI LA HOJA EXISTE: ELIMINARLA
        // ------------------------------------------
        console.log(`🔄 Reemplazando hoja existente: ${hojaDestino}`);
        
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

      // ------------------------------------------
      // 8b. COPIAR HOJA TEMPORAL AL SPREADSHEET PRINCIPAL
      // ------------------------------------------
      const copyResponse = await sheets.spreadsheets.sheets.copyTo({
        spreadsheetId: convertedFile.data.id,
        sheetId: tempSheetId,
        requestBody: {
          destinationSpreadsheetId: SPREADSHEET_ID
        }
      });

      // ------------------------------------------
      // 9. RENOMBRAR LA HOJA COPIADA
      // ------------------------------------------
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{
            updateSheetProperties: {
              properties: {
                sheetId: copyResponse.data.sheetId,
                title: hojaDestino
              },
              fields: 'title' // Solo actualizar el título
            }
          }]
        }
      });

      console.log(`✅ Datos actualizados en hoja: ${hojaDestino}`);

      // ------------------------------------------
      // 10. LIMPIEZA: ELIMINAR ARCHIVOS TEMPORALES
      // ------------------------------------------
      await drive.files.delete({ fileId: uploadedFile.data.id });
      await drive.files.delete({ fileId: convertedFile.data.id });
      console.log('🗑️ Archivos temporales eliminados');
    }

    // Mensaje final de éxito
    console.log('\n🎉 Proceso completado exitosamente');
    console.log(`🔗 Accede a tu archivo aquí: https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`);

  } catch (error) {
    // ------------------------------------------
    // MANEJO DE ERRORES
    // ------------------------------------------
    console.error('❌ Error en el proceso:', error.message);
    if (error.response) {
      console.error('Detalles:', error.response.data);
    }
  }
}

// ==============================================
// DETALLES ADICIONALES DEL FUNCIONAMIENTO
// ==============================================
/*
Flujo completo del proceso:
1. Autenticación con Google APIs
2. Para cada archivo Excel en ARCHIVOS_A_SUBIR:
   a. Subir el Excel a Drive como archivo temporal
   b. Convertirlo a formato Google Sheets
   c. Obtener la primera hoja del archivo convertido
   d. Buscar la hoja de destino en el documento principal
   e. Si existe, eliminarla
   f. Copiar la hoja temporal al documento principal
   g. Renombrar la hoja copiada al nombre deseado
   h. Eliminar los archivos temporales de Drive
3. Mostrar mensaje de éxito con enlace al documento

Consideraciones importantes:
- El archivo credentials.json debe tener los permisos adecuados
- El spreadsheet destino debe ser accesible por la cuenta de servicio
- Los archivos Excel deben estar en el mismo directorio que el script
- El proceso puede tardar varios segundos por archivo
*/
