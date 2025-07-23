// Importación de módulos necesarios
const fs = require('fs'); // Módulo nativo de Node.js para operaciones con el sistema de archivos
const { google } = require('googleapis'); // Cliente oficial de Google APIs para Node.js

// ==============================================
// CONFIGURACIÓN BÁSICA
// ==============================================

// Permisos que requerimos (en este caso, solo lectura de Drive)
const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

// Ruta al archivo JSON de credenciales descargado de Google Cloud Console
const KEYFILE_PATH = 'credentials.json';

// ID de la hoja de cálculo de Google que queremos descargar
// Este ID se encuentra en la URL de la hoja: docs.google.com/spreadsheets/d/[ESTE_ES_EL_ID]/edit
const SPREADSHEET_ID = '1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo';

// Nombre del archivo de salida donde guardaremos la hoja descargada
const OUTPUT_FILE = 'matches.xlsx';

// ==============================================
// FUNCIÓN PRINCIPAL PARA DESCARGAR LA HOJA
// ==============================================
async function downloadSheet() {
  try {
    // ------------------------------------------
    // 1. AUTENTICACIÓN CON GOOGLE APIs
    // ------------------------------------------
    
    // Creamos un nuevo cliente de autenticación usando las credenciales
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILE_PATH, // Ruta al archivo de credenciales
      scopes: SCOPES,        // Permisos que solicitamos
    });
    
    // Obtenemos el cliente autenticado
    const authClient = await auth.getClient();

    // ------------------------------------------
    // 2. CONFIGURACIÓN DEL SERVICIO DE DRIVE
    // ------------------------------------------
    
    // Creamos una instancia del cliente de Google Drive
    // Especificamos que usaremos la versión v3 de la API
    const drive = google.drive({ 
      version: 'v3',  // Versión de la API
      auth: authClient // Cliente autenticado
    });

    // ------------------------------------------
    // 3. EXPORTACIÓN DEL ARCHIVO
    // ------------------------------------------
    
    // Solicitamos la exportación del archivo
    const response = await drive.files.export({
      fileId: SPREADSHEET_ID, // ID de la hoja a exportar
      // Especificamos que queremos el formato Excel (xlsx)
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }, { 
      responseType: 'stream' // Indicamos que queremos recibir un stream de datos
    });

    // ------------------------------------------
    // 4. GUARDADO DEL ARCHIVO LOCALMENTE
    // ------------------------------------------
    
    // Creamos un stream de escritura para guardar el archivo
    const writer = fs.createWriteStream(OUTPUT_FILE);
    
    // Pipe: Conectamos el stream de lectura (datos de Google) con el de escritura (archivo local)
    response.data.pipe(writer);

    // ------------------------------------------
    // 5. MANEJO DE LA FINALIZACIÓN/ERRORES
    // ------------------------------------------
    
    // Creamos una promesa para esperar que termine la descarga
    await new Promise((resolve, reject) => {
      // Evento 'finish' se dispara cuando la escritura termina correctamente
      writer.on('finish', resolve);
      
      // Evento 'error' se dispara si hay problemas al escribir
      writer.on('error', reject);
    });
    
    // Mensaje de éxito si todo fue bien
    console.log(`✅ Descarga completada: ${OUTPUT_FILE}`);
  
  } catch (error) {
    // ------------------------------------------
    // 6. MANEJO DE ERRORES
    // ------------------------------------------
    
    // Mostramos mensaje de error principal
    console.error('❌ Error al descargar:', error.message);
    
    // Si el error viene de una respuesta HTTP (tiene .response)
    if (error.response) {
      // Mostramos detalles adicionales del error
      console.error('Detalles del error:', {
        status: error.response.status, // Código HTTP de error
        data: error.response.data      // Datos de la respuesta de error
      });
    }
  }
}

// ==============================================
// EJECUCIÓN DEL PROGRAMA
// ==============================================

// Llamamos a la función principal para iniciar el proceso
downloadSheet();
