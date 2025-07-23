Este proyecto fue desarrollado como parte de una memoria de título en la empresa Falabella, con el objetivo de automatizar la comparación de precios entre diversos marketplaces para facilitar el trabajo de los equipos comerciales.

El sistema extrae precios de productos desde múltiples sitios web, los procesa y genera informes estructurados para tres gerencias comerciales: Categorías Digitales, Electro Hogar y Softlines. Toda la información es almacenada y gestionada desde Google Sheets, integrándose además con Google Cloud Platform para facilitar el flujo de datos.

🛠️ Tecnologías utilizadas
Node.js: Lenguaje principal del sistema.

Playwright: Automatización del navegador para realizar web scraping.

Google Cloud: Manejo de APIs para la conexión con Google Sheets.

Google Apps Script: Automatización y formato de hojas de cálculo.

Visual Studio Code: Entorno de desarrollo.

📂 Estructura del proyecto (Node.js)
Script	Descripción
master.js	Script principal. Ejecuta de forma secuencial: descarga, scraping paralelo y subida.
descargar.js	Descarga la planilla base desde Google Sheets y la convierte en Excel.
index.js	Realiza scraping de precios sobre una hoja específica (Categorías Digitales). Contiene funciones para emular navegación humana y extraer precios.
index2.js	Versión de scraping para la hoja de Electro Hogar.
index3.js	Versión de scraping para la hoja de Softlines.
subir.js	Sube los archivos Excel procesados nuevamente a Google Sheets.

🔄 Flujo de trabajo
Descarga de datos desde Google Sheets (descargar.js).

Extracción y procesamiento de precios en paralelo por gerencia (index.js, index2.js, index3.js).

Carga de resultados a hojas separadas en Google Sheets (subir.js).

Formato, control y respaldo automatizado con Google Apps Script.

📊 Resultados
Se procesan 1332 SKUs en 2 horas, gracias a la ejecución paralela de tres instancias de navegador.

El sistema clasifica productos como matches, descompetitivos TMP, descompetitivos Global y quebrados.

Cada dato está enlazado a su página de origen.

Se mantiene un historial automático para análisis en Power BI.

🧩 Consideraciones
El sistema se ejecuta desde el computador del estudiante, por lo que no está 100% automatizado (requiere intervención para iniciar).

El scraping se realiza respetando límites y evitando bloqueos mediante técnicas de emulación de usuario.

En caso de querer escalar, se recomienda implementar rotación de proxies, migrar a una base de datos robusta y levantar en un entorno en la nube.
