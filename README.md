Este proyecto fue desarrollado como parte de una memoria de título en la empresa Falabella, con el objetivo de mejorar la comparación de precios entre diversos marketplace mediante automatizaciones para facilitar el trabajo de los equipos comerciales.

El sistema extrae precios de productos desde múltiples sitios web, los procesa y genera informes estructurados para tres gerencias comerciales: Categorías Digitales, Electro Hogar y Softlines. Toda la información es almacenada y gestionada desde Google Sheets, integrándose además con Google Cloud Platform para facilitar el flujo de datos.

Tecnologías utilizadas
- Node.js: Lenguaje principal del sistema.
- Playwright: Automatización del navegador para realizar web scraping.
- Google Sheets: Planilla para el repositorio de datos y visualizacion de resultados.
- Google Cloud: Manejo de APIs para la conexión con Google Sheets.
- Google Apps Script: Automatización y formato de hojas de cálculo.
- Visual Studio Code: Entorno de desarrollo.

Estructura del proyecto (Node.js)
A continuacion se listan los script para el funcionamiento de la herramienta:
- master.js	Ejecuta de forma secuencial: descargar.js index.js index2.js index3.js y subir.js.
- descargar.js	Descarga la planilla base desde Google Sheets y la convierte en Excel.
- index.js	Realiza scraping de precios sobre una hoja específica (Categorías Digitales). Contiene funciones para emular navegación humana y extraer precios.
- index2.js	Versión de scraping para la hoja de Electro Hogar.
- index3.js	Versión de scraping para la hoja de Softlines.
- subir.js	Sube los archivos Excel procesados nuevamente a Google Sheets.

Estructura del proyecto (Apps Script)
A continuacion se listan los script para gestionar el formato de la planilla contenida en Google Sheets.
- formato.gs: Modifica los estilos de la planilla para hacerla mas comoda a la vista.
- repetidos.gs: Elimina SKUs duplicados.
- historial.gs: Ingresa los datos de la tabla resumen a la hoja Historial.

Estructura del proyecto (Google Sheets)
Se adjunta una copia de la planilla en el repositorio de GitHub con el proposito de visualizar la estructura.

Consideraciones
- Para el funcionamiento de descargar.js y subir.js son necesarias las API de Google Sheets y Google Drive, ademas de las credenciales que deben ser ingresadas en el codigo.
- Para el funcionamiento de index.js, index2.js e index3.js, es necesario que se respeten los nombres y orden del archivo y sus respectivas hojas y columnas. En caso de cambiar un nombre, se debe hacer la modificacion respectiva en los codigos.

- El sistema se ejecuta desde el computador del estudiante, por lo que no está 100% automatizado (requiere intervención para iniciar).

- El scraping se realiza respetando límites y evitando bloqueos mediante técnicas de emulación de usuario, en caso de bloqueos por parte de algun marketplace se recomienda reiniciar el router con el fin de cambiar la IP.
- El scraping se realiza de forma simultanea para las 3 gerencias con el proposito de aumentar la velocidad.
- El tiempo promedio para procesar una sola URL es de 5 segundos.

- En caso de querer escalar, se recomienda implementar rotación de proxies, migrar a una base de datos robusta y levantar en un entorno en la nube.
- Es posible aumentar la velocidad del proceso realizando el scraping por KAM en lugar de por gerencias, pero requiere mayor poder de computo (CPU y RAM).
- Se recomienda agregar funcionalidades para interrumpir el proceso y ejecutar el proceso para rangos de SKU.
