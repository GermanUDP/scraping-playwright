function transferirDatosAlHistorial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hojasOrigen = [
    { nombre: 'Resultados CADS', categoria: 'Categorias Digitales' },
    { nombre: 'Resultados Electro Hogar', categoria: 'Electro Hogar' },
    { nombre: 'Resultados Softlines', categoria: 'Softlines' }
  ];
  const hojaDestino = ss.getSheetByName('Historial');
  
  // Obtener la última fila con datos en el historial
  const ultimaFila = hojaDestino.getLastRow();
  let filaActual = ultimaFila > 1 ? ultimaFila + 1 : 2;

  // Procesar cada hoja de origen
  hojasOrigen.forEach(hoja => {
    try {
      const sheet = ss.getSheetByName(hoja.nombre);
      if (!sheet) {
        Logger.log(`Hoja ${hoja.nombre} no encontrada, omitiendo...`);
        return;
      }
      
      // Obtener todos los datos de las columnas V y W
      const lastRow = sheet.getLastRow();
      const rangoV = sheet.getRange(1, 22, lastRow, 1).getValues(); // Columna V
      const rangoW = sheet.getRange(1, 23, lastRow, 1).getValues(); // Columna W
      
      // Buscar bloques de datos (etiqueta + valor)
      for (let i = 0; i < rangoV.length; i++) {
        // Buscar la fila que contiene "Fecha y hora"
        if (rangoV[i][0] === 'Fecha y hora') {
          // Verificar que tenemos las 5 filas necesarias
          if (i + 4 >= rangoV.length) {
            Logger.log(`Bloque incompleto en ${hoja.nombre}, fila ${i+1}`);
            continue;
          }
          
          // Obtener la fecha (está en la celda W de esta fila)
          let fechaHora = rangoW[i][0];
          
          // Convertir a objeto Date si es string
          if (typeof fechaHora === 'string') {
            // Parsear formato "2025-07-23 08:17:30"
            const [datePart, timePart] = fechaHora.split(' ');
            const [year, month, day] = datePart.split('-');
            const [hours, minutes, seconds] = timePart.split(':');
            fechaHora = new Date(year, month - 1, day, hours, minutes, seconds);
          }
          
          // Verificar que la fecha sea válida
          if (!(fechaHora instanceof Date) || isNaN(fechaHora.getTime())) {
            Logger.log(`Fecha inválida en ${hoja.nombre}, fila ${i+1}`);
            continue;
          }
          
          // Extraer los 4 valores siguientes
          const datosFormateados = [
            [
              Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
              hoja.categoria,
              'Matches',
              rangoW[i+1][0]
            ],
            [
              Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
              hoja.categoria,
              'Descompetitivos TMP',
              rangoW[i+2][0]
            ],
            [
              Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
              hoja.categoria,
              'Descompetitivos Global',
              rangoW[i+3][0]
            ],
            [
              Utilities.formatDate(fechaHora, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss'),
              hoja.categoria,
              'Quebrados',
              rangoW[i+4][0]
            ]
          ];
          
          // Escribir los datos en el historial
          hojaDestino.getRange(filaActual, 1, 4, 4).setValues(datosFormateados);
          filaActual += 4;
          
          // Saltar las filas que ya procesamos
          i += 4;
        }
      }
    } catch (e) {
      Logger.log(`Error procesando ${hoja.nombre}: ${e.message}`);
    }
  });
  
  ordenarHistorialPorFecha();
}

function ordenarHistorialPorFecha() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const hoja = ss.getSheetByName('Historial');
  const ultimaFila = hoja.getLastRow();
  
  if (ultimaFila > 2) {
    hoja.getRange(2, 1, ultimaFila - 1, 4).sort({column: 1, ascending: true});
  }
}
