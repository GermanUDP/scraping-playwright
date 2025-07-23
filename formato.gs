function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Mis Herramientas')
    .addItem('Aplicar Formatos Personalizados', 'aplicarFormatosPersonalizados')
    .addToUi();
}

function aplicarFormatosPersonalizados() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ['Resultados CADS', 'Resultados Electro Hogar', 'Resultados Softlines'];
  const resultados = { hojasProcesadas: 0, errores: [] };
  
  sheets.forEach(sheetName => {
    try {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) {
        resultados.errores.push(`Hoja ${sheetName} no encontrada`);
        return;
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        resultados.errores.push(`No hay datos en ${sheetName}`);
        return;
      }
      
      // 1. Aplicar colores de fondo fijos
      aplicarColoresFijosActualizado(sheet, lastRow);
      
      // 2. Aplicar formato condicional (ahora a columnas 7 y 10)
      aplicarFormatoCondicionalPriceIndex(sheet, lastRow);
      
      // 3. Formatear encabezados básicos
      formatearEncabezadosBasicos(sheet);
      
      resultados.hojasProcesadas++;
    } catch (error) {
      resultados.errores.push(`Error en ${sheetName}: ${error.message}`);
    }
  });
  
  return resultados;
}

function aplicarColoresFijosActualizado(sheet, lastRow) {
  const formatRules = [
    { cols: [11, 12], color: '#d9ead3' },   // Falabella, T Falabella - Verde claro
    { cols: [13, 14], color: '#c9daf8' },   // Paris, T Paris - Celeste claro
    { cols: [15, 16], color: '#d9d2e9' },   // Ripley, T Ripley - Morado claro
    { cols: [17], color: '#fff2cc' },       // Mercado Libre - Amarillo claro
    { cols: [18], color: '#cfe2f3' },       // Lider - Azul claro
    { cols: [19, 20], color: '#f3f3f3' },   // T Sodimac, Sodimac - Gris claro
    { cols: [5, 8], color: '#fce5cd' }      // Mínimo, Mínimo Tarjeta - Naranja claro
  ];
  
  formatRules.forEach(rule => {
    rule.cols.forEach(col => {
      sheet.getRange(2, col, lastRow - 1).setBackground(rule.color);
    });
  });
  
  // Columnas especiales (Ganadores)
  sheet.getRange(2, 6, lastRow - 1).setBackground('#d0e0e3');  // Ganador - Azul muy claro
  sheet.getRange(2, 9, lastRow - 1).setBackground('#d0e0e3');  // Ganador Tarjeta - Azul muy claro
}

function aplicarFormatoCondicionalPriceIndex(sheet, lastRow) {
  // Definir los rangos a formatear: columna 7 (G) y columna 10 (J)
  const qRangeNormal = sheet.getRange(2, 7, lastRow - 1);    // G2:G[lastRow] (Price Index Normal)
  const qRangeTarjeta = sheet.getRange(2, 10, lastRow - 1);  // J2:J[lastRow] (Price Index Tarjeta)
  const ranges = [qRangeNormal, qRangeTarjeta];
  const rules = [];
  
  // Limpiar reglas existentes primero
  sheet.clearConditionalFormatRules();
  
  // Aplicar las mismas reglas a ambos rangos
  ranges.forEach(range => {
    // Regla para valores < 100 (verde)
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(100)
        .setFontColor('#38761d')
        .setRanges([range])
        .build()
    );
    
    // Regla para valores > 100 (rojo)
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThan(100)
        .setFontColor('#cc0000')
        .setRanges([range])
        .build()
    );
    
    // Regla para valores = 100 (negro)
    rules.push(
      SpreadsheetApp.newConditionalFormatRule()
        .whenNumberEqualTo(100)
        .setFontColor('#000000')
        .setRanges([range])
        .build()
    );
  });
  
  sheet.setConditionalFormatRules(rules);
}

function formatearEncabezadosBasicos(sheet) {
  const headerRange = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  headerRange.setBackground('#434343')
            .setFontColor('white')
            .setFontWeight('bold')
            .setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
}
