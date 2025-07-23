// Importación de módulos necesarios
const { exec } = require('child_process'); // Módulo para ejecutar comandos del sistema
const util = require('util'); // Utilidades de Node.js
const execPromise = util.promisify(exec); // Convertir exec a versión con promesas

// ==============================================
// FUNCIÓN PRINCIPAL - EJECUCIÓN DE PROCESOS
// ==============================================
/**
 * @function runParallelProcesses
 * @description Ejecuta un flujo automatizado en 3 fases:
 * 1. Descarga de datos iniciales
 * 2. Procesamiento paralelo de datos
 * 3. Subida de resultados
 */
async function runParallelProcesses() {
  try {
    // Mensaje inicial
    console.log('🚀 Iniciando proceso automatizado...\n');

    // ------------------------------------------
    // FASE 1: DESCARGAR DATOS INICIALES
    // ------------------------------------------
    console.log('⬇️ Descargando datos de Google Sheets...');
    await execPromise('node descargar.js'); // Ejecuta el script de descarga
    console.log('✅ Descarga completada\n');

    // ------------------------------------------
    // FASE 2: PROCESAMIENTO PARALELO
    // ------------------------------------------
    console.log('🔄 Procesando datos en paralelo...');
    const startTime = Date.now(); // Marca de tiempo inicial
    
    // Array de promesas que representan los procesos paralelos
    const processes = [
      // Proceso 1: Ejecuta index.js y muestra mensaje al completar
      execPromise('node index.js')
        .then(() => console.log('✅ index.js completado'))
        .catch(err => {
          console.error('❌ Error en index.js:', err.message);
          throw err; // Relanza el error para detener el flujo
        }),
      
      // Proceso 2: Ejecuta index2.js y muestra mensaje al completar
      execPromise('node index2.js')
        .then(() => console.log('✅ index2.js completado'))
        .catch(err => {
          console.error('❌ Error en index2.js:', err.message);
          throw err;
        }),
      
      // Proceso 3: Ejecuta index3.js y muestra mensaje al completar
      execPromise('node index3.js')
        .then(() => console.log('✅ index3.js completado'))
        .catch(err => {
          console.error('❌ Error en index3.js:', err.message);
          throw err;
        })
    ];
    
    // Espera a que todos los procesos terminen (o alguno falle)
    await Promise.all(processes);
    
    // Calcula y muestra el tiempo total de procesamiento
    const endTime = Date.now();
    console.log(`\n✅ Todos los procesos completados en ${(endTime - startTime)/1000} segundos\n`);

    // ------------------------------------------
    // FASE 3: SUBIR RESULTADOS
    // ------------------------------------------
    console.log('⬆️ Subiendo resultados a Google Sheets...');
    await execPromise('node subir.js'); // Ejecuta el script de subida
    console.log('✅ Carga de resultados completada\n');

    // Mensaje final de éxito
    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log(`🔗 Accede a tu archivo: https://docs.google.com/spreadsheets/d/1lTkvAMSecN18USpqeDePy-WFgFUtisRewSYwaNCKZbo/edit`);

  } catch (error) {
    // ------------------------------------------
    // MANEJO DE ERRORES
    // ------------------------------------------
    console.error('❌ Error en el proceso automatizado:', error.message);
    if (error.stderr) {
      console.error('Detalles:', error.stderr); // Muestra salida de error del comando
    }
    process.exit(1); // Termina el proceso con código de error
  }
}

// Ejecuta la función principal
runParallelProcesses();

// ==============================================
// DETALLES ADICIONALES
// ==============================================
/*
Características clave:
1. Ejecución secuencial de las fases principales
2. Procesamiento paralelo de los scripts intermedios
3. Medición precisa del tiempo de ejecución
4. Manejo robusto de errores
5. Feedback claro del progreso

Mejoras potenciales:
1. Agregar timeouts para cada proceso
2. Implementar reintentos automáticos
3. Agregar validación de resultados entre fases
4. Configuración externa de los scripts a ejecutar
5. Logging más detallado en archivo

Consideraciones:
- Los scripts (descargar.js, index.js, etc.) deben estar en el mismo directorio
- Requiere Node.js instalado
- Cada script debe manejar sus propios errores internos
- El paralelismo puede consumir muchos recursos según la complejidad de los scripts
*/
