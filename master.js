const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runParallelProcesses() {
  try {
    console.log('🚀 Iniciando proceso automatizado...\n');

    // 1. Descargar
    console.log('⬇️ Descargando datos de Google Sheets...');
    await execPromise('node descargar.js');
    console.log('✅ Descarga completada\n');

    // 2. Procesar en paralelo
    console.log('🔄 Procesando datos en paralelo...');
    const startTime = Date.now();
    
    // Ejecutar los tres procesos en paralelo
    const processes = [
      execPromise('node index.js').then(() => console.log('✅ index.js completado')),
      execPromise('node index2.js').then(() => console.log('✅ index2.js completado')),
      execPromise('node index3.js').then(() => console.log('✅ index3.js completado'))
    ];
    
    await Promise.all(processes);
    
    const endTime = Date.now();
    console.log(`\n✅ Todos los procesos completados en ${(endTime - startTime)/1000} segundos\n`);

    // 3. Subir
    console.log('⬆️ Subiendo resultados a Google Sheets...');
    await execPromise('node subir.js');
    console.log('✅ Carga de resultados completada\n');

    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log(`🔗 Accede a tu archivo: https://docs.google.com/spreadsheets/d/1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo/edit`);

  } catch (error) {
    console.error('❌ Error en el proceso automatizado:', error.message);
    if (error.stderr) {
      console.error('Detalles:', error.stderr);
    }
    process.exit(1);
  }
}

runParallelProcesses();