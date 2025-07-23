function eliminarSKUsDuplicadosEnHojas() {
  const nombresHojas = ["Categorias Digitales", "Electro Hogar", "Softlines"];
  const columnaSKU = 4; // Columna D
  let totalEliminados = 0;

  nombresHojas.forEach(nombreHoja => {
    const hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombreHoja);
    if (!hoja) {
      console.warn(`⚠️ No se encontró la hoja: ${nombreHoja}`);
      return;
    }

    const ultimaFila = hoja.getLastRow();
    const datos = hoja.getRange(2, columnaSKU, ultimaFila - 1).getValues(); // desde fila 2
    const skusVistos = new Set();
    const filasAEliminar = [];
    const skusEliminados = [];

    datos.forEach((fila, index) => {
      const sku = fila[0];
      if (!sku) return;

      if (skusVistos.has(sku)) {
        filasAEliminar.push(index + 2); // fila real (ajustando por encabezado)
        skusEliminados.push(sku);
      } else {
        skusVistos.add(sku);
      }
    });

    for (let i = filasAEliminar.length - 1; i >= 0; i--) {
      hoja.deleteRow(filasAEliminar[i]);
    }

    totalEliminados += filasAEliminar.length;

    console.log(`🗂 Hoja: "${nombreHoja}"`);
    console.log(`   ➤ SKUs eliminados: ${filasAEliminar.length}`);
    if (skusEliminados.length > 0) {
      console.log(`   ➤ Lista: ${skusEliminados.join(", ")}`);
    } else {
      console.log(`   ➤ No se encontraron duplicados.`);
    }
  });

  console.log(`✅ Proceso finalizado. Total de SKUs eliminados en todas las hojas: ${totalEliminados}`);
}
