const { chromium } = require('playwright');
const XLSX = require('xlsx');


async function emulateHuman(page) {
  // Versión extremadamente rápida (solo lo esencial)
  await page.mouse.move(100, 200, { steps: 3 });
  await page.waitForTimeout(200 + Math.random() * 300); // 200-500ms
}


async function scrapeData(url, tienda, rowData) {
  if (!url) return;


  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled'],
  });


  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  });


  const page = await context.newPage();


  try {
    console.log(`Extrayendo datos de ${tienda}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });


    const captchaSelector = '#g-recaptcha, .captcha-box, .recaptcha-checkbox';
    if (await page.$(captchaSelector)) {
      console.log(`Se detectó un CAPTCHA en ${tienda}, omitiendo esta URL.`);
      await browser.close();
      return;
    }


    await emulateHuman(page);


    let nombre = '', precio = '', precioTarjeta = '';
    const EXTRACTION_TIMEOUT = 10000; // 10 segundos para extracción


    if (tienda === 'Falabella') {
      const agotadoSelector = '#testId-product-outofstock > div > div > h2';
      if (await page.$(agotadoSelector)) {
        console.log('Producto agotado en Falabella, indicando en la hoja de cálculo.');
        rowData[tienda] = 'AGOTADO';
        await browser.close();
        return;
      }
     
      nombre = await page.textContent('.product-name-wrapper h1').catch(() => '');
     
      // Usando Promise.race para implementar timeout
      const getPrecios = async () => {
        const precioNormalSelector = await page.$('li.prices-1 span.copy17.primary.senary.bold.line-height-29') ||
                                   await page.$('li.prices-0 span.copy12.primary.senary.bold.line-height-29');
        const precioTarjetaSelector = await page.$('li.prices-0 span.copy12.primary.high.jsx-2835692965.normal.line-height-29');
       
        precio = precioNormalSelector ? await precioNormalSelector.textContent() : '';
        precioTarjeta = precioTarjetaSelector ? await precioTarjetaSelector.textContent() : '';
      };
     
      await Promise.race([
        getPrecios(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al extraer precios en Falabella')), EXTRACTION_TIMEOUT))
      ]).catch(e => console.log(e.message));


    } else if (tienda === 'Paris') {
      try {
        const selectores = {
          normalConTarjeta: 'body > div.flex.flex-col.gap-6.tablet_w\\:gap-4.desktop\\:gap-6.tablet_w\\:px-6.desktop\\:px-16.tablet_w\\:pt-4.desktop\\:pt-6.bg-neutral-100.max-w-\\[1536px\\].m-auto > div.flex.gap-6.flex-col.tablet_w\\:flex-row > div.flex.flex-col.gap-8.border.border-neutral-300.bg-white.rounded-2xl.p-4.shrink-0.tablet_w\\:w-\\[420px\\] > div.flex.flex-col.gap-4 > div.flex.flex-col.gap-1 > div:nth-child(2) > h2',
          soloNormal: 'body > div.flex.flex-col.gap-6.tablet_w\\:gap-4.desktop\\:gap-6.tablet_w\\:px-6.desktop\\:px-16.tablet_w\\:pt-4.desktop\\:pt-6.bg-neutral-100.max-w-\\[1536px\\].m-auto > div.flex.gap-6.flex-col.tablet_w\\:flex-row > div.flex.flex-col.gap-8.border.border-neutral-300.bg-white.rounded-2xl.p-4.shrink-0.tablet_w\\:w-\\[420px\\] > div.flex.flex-col.gap-4 > div.flex.flex-col.gap-1 > div > h2',
          tarjeta: 'body > div.flex.flex-col.gap-6.tablet_w\\:gap-4.desktop\\:gap-6.tablet_w\\:px-6.desktop\\:px-16.tablet_w\\:pt-4.desktop\\:pt-6.bg-neutral-100.max-w-\\[1536px\\].m-auto > div.flex.gap-6.flex-col.tablet_w\\:flex-row > div.flex.flex-col.gap-8.border.border-neutral-300.bg-white.rounded-2xl.p-4.shrink-0.tablet_w\\:w-\\[420px\\] > div.flex.flex-col.gap-4 > div.flex.flex-col.gap-1 > div:nth-child(1) > h2'
        };
       
        await Promise.race([
          (async () => {
            const precioConTarjeta = await page.$(selectores.normalConTarjeta);
            if (precioConTarjeta) {
              precio = await page.textContent(selectores.normalConTarjeta);
              precioTarjeta = await page.textContent(selectores.tarjeta);
            } else {
              precio = await page.textContent(selectores.soloNormal);
              precioTarjeta = '';
            }
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al extraer precios en Paris')), EXTRACTION_TIMEOUT))
        ]);
      } catch (error) {
        console.log(`Error en Paris: ${error.message}`);
        //await page.screenshot({ path: `paris-error-${Date.now()}.png` });
        precio = '';
        precioTarjeta = '';
      }


    } else if (tienda === 'Ripley') {
      const agotadoSelector = 'body > div.container > div.error-page-container > div > h2';
      if (await page.$(agotadoSelector)) {
        console.log('Producto agotado en Ripley, indicando en la hoja de cálculo.');
        rowData[tienda] = 'AGOTADO';
        await browser.close();
        return;
      }
   
      nombre = await page.textContent('.product-header.hidden-xs h1').catch(() => '');
   
      try {
        await Promise.race([
          (async () => {
            const precioTarjetaSelector = await page.$('#row > div.col-xs-12.col-sm-12.col-md-5 > section:nth-child(2) > dl > div.product-price-container.product-ripley-price > dt');
            if (precioTarjetaSelector) {
              precioTarjeta = await precioTarjetaSelector.textContent();
              const precioNormalSelector = await page.$('#row > div.col-xs-12.col-sm-12.col-md-5 > section:nth-child(2) > dl > div.product-price-container.product-internet-price-not-best > dt');
              precio = precioNormalSelector ? await precioNormalSelector.textContent() : '';
            } else {
              const precioNormalSelector = await page.$('.product-price-container.product-internet-price dt');
              precio = precioNormalSelector ? await precioNormalSelector.textContent() : '';
            }
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al extraer precios en Ripley')), EXTRACTION_TIMEOUT))
        ]);
      } catch (error) {
        console.log(`Error en Ripley: ${error.message}`);
        precio = '';
        precioTarjeta = '';
      }


    } else if (tienda === 'Mercado Libre') {
      const agotadoSelector = '#ui-pdp-main-container div.ui-pdp-message--warning';
      const agotadoElement = await page.$(agotadoSelector);
     
      if (agotadoElement) {
        console.log('Producto agotado en Mercado Libre, indicando en la hoja de cálculo.');
        rowData[tienda] = 'AGOTADO';
        await browser.close();
        return;
      }
   
      try {
        await Promise.race([
          (async () => {
            nombre = await page.textContent('#ui-pdp-main-container h1.ui-pdp-title').catch(() =>
              page.textContent('#ui-pdp-main-container > div.ui-pdp-container__col.col-3.ui-pdp-container--column-center.pb-40 > div > div.ui-pdp-container__row.ui-pdp-with--separator--fluid.ui-pdp-with--separator--40-24 > div.ui-pdp-container__col.col-2.mr-24.mt-8 > div.ui-pdp-container__top-wrapper.mt-40 > div > div.ui-pdp-header__title-container > h1').catch(() => '')
            );
           
            precio = await page.textContent('div.ui-pdp-price__second-line span.andes-money-amount__fraction').catch(() =>
              page.textContent('#price > div > div.ui-pdp-price__main-container > div.ui-pdp-price__second-line > span > span > span.andes-money-amount__fraction').catch(() => '')
            );
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al extraer precios en Mercado Libre')), EXTRACTION_TIMEOUT))
        ]);
      } catch (error) {
        console.log(`Error en Mercado Libre: ${error.message}`);
        precio = '';
      }


    } else if (tienda === 'Lider') {
      const agotadoSelector = '#maincontent > section > main > div.flex.flex-column.h-100 > div:nth-child(2) > div > div.w_8XBa.w_n9r1.w_yr8k > div > div:nth-child(2) > div > div > section:nth-child(6) > div > div.f4.light-gray > div > div > div > div.flex-auto > div > div';
      if (await page.$(agotadoSelector)) {
        console.log('Producto agotado en Lider, indicando en la hoja de cálculo.');
        rowData[tienda] = 'AGOTADO';
        await browser.close();
        return;
      }
   
      nombre = await page.textContent('#main-title').catch(() => '');
   
      try {
        await page.waitForSelector('span.b.lh-copy.dark-gray.f1.mr2 span.inline-flex.flex-column span', { timeout: EXTRACTION_TIMEOUT });
        precio = await page.textContent('span.b.lh-copy.dark-gray.f1.mr2 span.inline-flex.flex-column span');
      } catch (error) {
        console.error(`No se pudo encontrar el precio en Lider: ${error.message}`);
        precio = '';
      }


    } else if (tienda === 'Sodimac') {
      const agotadoSelector = '#testId-product-outofstock > div > div > h2';
      if (await page.$(agotadoSelector)) {
        console.log('Producto agotado en Sodimac, indicando en la hoja de cálculo.');
        rowData[tienda] = 'AGOTADO';
        await browser.close();
        return;
      }
   
      nombre = await page.textContent('.product-name-wrapper h1').catch(() => '');
   
      try {
        await Promise.race([
          (async () => {
            await page.waitForSelector('ol > li', { timeout: EXTRACTION_TIMEOUT });
           
            const precioNormalConTarjetaSelector1 = 'ol > li.prices-1 > div > span.copy17.primary.senary.bold.line-height-29';
            const precioNormalConTarjetaSelector2 = 'ol > li.prices-1 > div > span.copy17.primary.senary.jsx-2835692965.bold.line-height-29';
            const precioTarjetaSelector = 'ol > li.prices-0 > div > span.copy12.primary.high.jsx-2835692965.normal.line-height-29';
            const precioNormalSinTarjetaSelector1 = 'ol > li.prices-0 > div > span.copy12.primary.senary.jsx-2835692965.bold.line-height-29';
            const precioNormalSinTarjetaSelector2 = 'ol > li > div > span.copy12.primary.senary.jsx-2835692965.bold.line-height-29';
           
            let precioNormalElement = await page.$(precioNormalConTarjetaSelector1) || await page.$(precioNormalConTarjetaSelector2);
            if (!precioNormalElement) {
              precioNormalElement = await page.$(precioNormalSinTarjetaSelector1) || await page.$(precioNormalSinTarjetaSelector2);
            }
           
            precio = precioNormalElement ? await precioNormalElement.textContent() : '';
           
            const precioTarjetaElement = await page.$(precioTarjetaSelector);
            precioTarjeta = precioTarjetaElement ? await precioTarjetaElement.textContent() : '';
          })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout al extraer precios en Sodimac')), EXTRACTION_TIMEOUT))
        ]);
      } catch (error) {
        console.error(`Error en Sodimac: ${error.message}`);
        precio = '';
        precioTarjeta = '';
      }
    }


    if (!rowData.nombre && nombre) rowData.nombre = nombre;
    rowData[tienda] = precio;
    if (precioTarjeta) rowData[`T ${tienda}`] = precioTarjeta;
  } catch (error) {
    console.error(`Error al extraer datos de ${tienda}: ${error.message}`);
  } finally {
    await browser.close();
  }
}


const readline = require('readline');


// Variable de control para detener el proceso
let exitRequested = false;


// Configurar la captura de tecla ESC
function setupKeyListener() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'escape') {
      exitRequested = true;
      console.log('\n[!] Solicitud de detención recibida. Finalizando después de esta fila...');
    }
  });
}


function getLocalDateTime() {
  const now = new Date();
  const pad = num => num.toString().padStart(2, '0');
 
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${
    pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

async function main() {
  // Configuración inicial
  console.log('Iniciando proceso de extracción...');
  const fechaHoraEjecucion = getLocalDateTime();
  console.log(`Fecha y hora real: ${fechaHoraEjecucion}`);

  // Leer archivo de entrada
  const workbook = XLSX.readFile('matches.xlsx');
  const sheet = workbook.Sheets['Electro Hogar'];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  const results = [];

  // Contadores para el resumen
  let productosDescompetitivos = 0;
  let filasConPriceIndex = 0;
  let productosDescompetitivosGlobal = 0;
  let productosQuebrados = 0;
  let productosDescompetitivosTarjeta = 0; // Nuevo contador para Price Index Tarjeta

  // Función para convertir texto a número de manera segura
  function safeNumberConvert(value) {
    if (typeof value === 'number') return value;
    if (!value || value === 'N/A' || value === 'AGOTADO') return null;
   
    const cleaned = String(value).replace(/[^\d,.-]/g, '');
    const normalized = cleaned.replace(/\./g, '').replace(',', '.');
   
    const num = parseFloat(normalized);
    return isNaN(num) ? null : num;
  }

  // Procesar cada fila
  for (const [index, row] of data.slice(1).entries()) {
    console.log(`Procesando fila ${index + 1} de ${data.length - 1}`);
   
    const rowData = {
      KAM: row[0],
      seller: row[1],
      nombre: row[2],
      sku: row[3],
      Falabella: '',
      'T Falabella': '',
      Paris: '',
      'T Paris': '',
      Ripley: '',
      'T Ripley': '',
      'Mercado Libre': '',
      Lider: '',
      'T Sodimac': '',
      Sodimac: '',
      'Mínimo TMP': '',
      'Ganador TMP': '',
      'Price Index TMP': '',
      'Mínimo Tarjeta': '',
      'Ganador Tarjeta': '',
      'Price Index Tarjeta': '' // Nueva columna
    };
   
    const tiendas = ['Falabella', 'Paris', 'Ripley', 'Mercado Libre', 'Lider', 'Sodimac'];
    const precios = {};
    const preciosConFalabella = {};
    const links = {};
    let precioFalabella = null;
    let tieneUrlFalabella = false;
    let tieneOtroMarketplace = false;
    let precioMinimoCompetencia = null;

    // Procesar URLs y precios
    for (let i = 0; i < tiendas.length; i++) {
      const url = row[i + 4];
      if (url && typeof url === 'string' && url.trim() !== '') {
        if (tiendas[i] === 'Falabella') {
          tieneUrlFalabella = true;
        } else {
          tieneOtroMarketplace = true;
        }
        
        await scrapeData(url, tiendas[i], rowData);
        
        const precioKey = tiendas[i];
        const tarjetaKey = `T ${tiendas[i]}`;
        
        // Procesar precio normal
        if (rowData[precioKey]) {
          const precioNum = safeNumberConvert(rowData[precioKey]);
          
          rowData[precioKey] = {
            t: precioNum !== null ? 'n' : 's',
            v: precioNum !== null ? precioNum : rowData[precioKey],
            l: { Target: url },
            z: precioNum >= 1000 ? '#,##0' : undefined
          };
          
          if (precioNum !== null && !isNaN(precioNum)) {
            preciosConFalabella[precioKey] = precioNum;
            if (!precioKey.startsWith('T ') && precioKey !== 'Falabella') {
              precios[precioKey] = precioNum;
              links[precioKey] = url;
            }
            if (precioKey === 'Falabella') {
              precioFalabella = precioNum;
            }
          }
        }
        
        // Procesar precio tarjeta
        if (rowData[tarjetaKey]) {
          const precioTarjetaNum = safeNumberConvert(rowData[tarjetaKey]);
          
          rowData[tarjetaKey] = {
            t: precioTarjetaNum !== null ? 'n' : 's',
            v: precioTarjetaNum !== null ? precioTarjetaNum : rowData[tarjetaKey],
            l: { Target: url },
            z: precioTarjetaNum >= 1000 ? '#,##0' : undefined
          };
        }
      }
    }
   
    // Contar filas con matches válidos
    if (tieneUrlFalabella && tieneOtroMarketplace) {
      filasConPriceIndex++;
    }
   
    // Calcular mínimo INCLUYENDO Falabella (para columnas Mínimo/Ganador)
    if (Object.keys(preciosConFalabella).length > 0) {
      const ordenPrioridad = ['Falabella', 'Paris', 'Ripley', 'Mercado Libre', 'Lider', 'Sodimac'];
     
      const [tiendaGanadora, precioMinimo] = Object.entries(preciosConFalabella)
        .reduce((min, entry) => {
          const [tiendaActual, precioActual] = entry;
          const [tiendaMin, precioMin] = min;
         
          if (Math.abs(precioActual - precioMin) < 0.01) {
            const prioridadActual = ordenPrioridad.indexOf(tiendaActual);
            const prioridadMin = ordenPrioridad.indexOf(tiendaMin);
            return prioridadActual < prioridadMin ? entry : min;
          }
          return precioActual < precioMin ? entry : min;
        }, [null, Infinity]);
     
      rowData['Mínimo TMP'] = {
        t: 'n',
        v: precioMinimo,
        l: { Target: links[tiendaGanadora] || row[4] },
        z: '#,##0'
      };
     
      rowData['Ganador TMP'] = {
        t: 's',
        v: tiendaGanadora
      };
    } else {
      rowData['Mínimo TMP'] = { t: 's', v: 'N/A' };
      rowData['Ganador TMP'] = { t: 's', v: 'N/A' };
    }
   
    // Calcular Price Index usando mínimo EXCLUYENDO Falabella
    if (Object.keys(precios).length > 0 && precioFalabella !== null) {
      precioMinimoCompetencia = Object.values(precios).reduce((min, precio) =>
        precio < min ? precio : min, Infinity);
     
      const priceIndex = Math.round((precioFalabella / precioMinimoCompetencia) * 100);
     
      rowData['Price Index TMP'] = {
        t: 'n',
        v: priceIndex,
        z: '0'
      };

      if (priceIndex > 100) productosDescompetitivos++;
    } else {
      rowData['Price Index TMP'] = { t: 's', v: 'N/A' };
    }

    // ========= Cálculo de Mínimo Tarjeta y Ganador Tarjeta ========= //
    const preciosConUrls = [
      { tienda: 'Falabella', precio: rowData['Falabella']?.v, url: rowData['Falabella']?.l?.Target },
      { tienda: 'T Falabella', precio: rowData['T Falabella']?.v, url: rowData['T Falabella']?.l?.Target },
      { tienda: 'Paris', precio: rowData['Paris']?.v, url: rowData['Paris']?.l?.Target },
      { tienda: 'T Paris', precio: rowData['T Paris']?.v, url: rowData['T Paris']?.l?.Target },
      { tienda: 'Ripley', precio: rowData['Ripley']?.v, url: rowData['Ripley']?.l?.Target },
      { tienda: 'T Ripley', precio: rowData['T Ripley']?.v, url: rowData['T Ripley']?.l?.Target },
      { tienda: 'Mercado Libre', precio: rowData['Mercado Libre']?.v, url: rowData['Mercado Libre']?.l?.Target },
      { tienda: 'Lider', precio: rowData['Lider']?.v, url: rowData['Lider']?.l?.Target },
      { tienda: 'Sodimac', precio: rowData['Sodimac']?.v, url: rowData['Sodimac']?.l?.Target },
      { tienda: 'T Sodimac', precio: rowData['T Sodimac']?.v, url: rowData['T Sodimac']?.l?.Target }
    ].filter(item => item.precio !== undefined && !isNaN(item.precio));

    if (preciosConUrls.length > 0) {
      const ordenPrioridad = [
        'Falabella', 'T Falabella', 'Paris', 'T Paris', 
        'Ripley', 'T Ripley', 'Mercado Libre', 'Lider', 
        'Sodimac', 'T Sodimac'
      ];

      const { tienda, precio, url } = preciosConUrls.reduce((min, item) => {
        if (Math.abs(item.precio - min.precio) < 0.01) {
          const prioridadActual = ordenPrioridad.indexOf(item.tienda);
          const prioridadMin = ordenPrioridad.indexOf(min.tienda);
          return prioridadActual < prioridadMin ? item : min;
        }
        return item.precio < min.precio ? item : min;
      }, { precio: Infinity, tienda: null, url: '' });

      // Mínimo Tarjeta
      rowData['Mínimo Tarjeta'] = {
        t: 'n',
        v: precio,
        l: { Target: url || '' },
        z: '#,##0'
      };

      // Ganador Tarjeta
      rowData['Ganador Tarjeta'] = {
        t: 's',
        v: tienda
      };

      // ========= [CORRECCIÓN] Cálculo de Price Index Tarjeta ========= //
      // Tomamos el precio de Falabella (normal o tarjeta, el que exista)
      const precioFalabellaTarjeta = safeNumberConvert(rowData['T Falabella']?.v) || 
                               safeNumberConvert(rowData['Falabella']?.v);

      // Obtenemos el mínimo de la competencia (excluyendo Falabella y T Falabella)
      const preciosCompetenciaTarjeta = preciosConUrls
        .filter(item => !['Falabella', 'T Falabella'].includes(item.tienda))
        .map(item => item.precio);

      if (precioFalabellaTarjeta !== null && !isNaN(precioFalabellaTarjeta) && preciosCompetenciaTarjeta.length > 0) {
        const minimoCompetenciaTarjeta = Math.min(...preciosCompetenciaTarjeta);
        const priceIndexTarjeta = Math.round((precioFalabellaTarjeta / minimoCompetenciaTarjeta) * 100);
    
        rowData['Price Index Tarjeta'] = {
          t: 'n',
          v: priceIndexTarjeta,
          z: '0'
        };

        // Contar productos descompetitivos en tarjeta
        if (priceIndexTarjeta > 100) {
          productosDescompetitivosTarjeta++;
        }
      } else {
        rowData['Price Index Tarjeta'] = { t: 's', v: 'N/A' };
      }
    } else {
      rowData['Mínimo Tarjeta'] = { t: 's', v: 'N/A' };
      rowData['Ganador Tarjeta'] = { t: 's', v: 'N/A' };
      rowData['Price Index Tarjeta'] = { t: 's', v: 'N/A' };
    }

    // Contar productos donde Falabella no es el ganador
    if (rowData['Ganador Tarjeta']?.v && 
        rowData['Ganador Tarjeta'].v !== 'Falabella' && 
        rowData['Ganador Tarjeta'].v !== 'T Falabella' &&
        rowData['Ganador Tarjeta'].v !== 'N/A') {
      productosDescompetitivosGlobal++;
    }

    // Contar productos agotados en Falabella
    if (rowData['Falabella']?.v === 'AGOTADO') {
      productosQuebrados++;
    }
   
    results.push(rowData);
  }

  const columnOrder = [
    'KAM', 'seller', 'nombre', 'sku', 
    'Mínimo TMP', 'Ganador TMP', 'Price Index TMP',
    'Mínimo Tarjeta', 'Ganador Tarjeta', 'Price Index Tarjeta', // Nueva columna agregada aquí
    'Falabella', 'T Falabella', 
    'Paris', 'T Paris',
    'Ripley', 'T Ripley', 
    'Mercado Libre', 
    'Lider', 
    'T Sodimac', 'Sodimac'
  ];

  // Crear nuevo workbook
  const newWorkbook = XLSX.utils.book_new();
 
  // Convertir resultados a hoja de cálculo
  const newSheet = XLSX.utils.json_to_sheet(results.map(row => {
    const filteredRow = {};
    columnOrder.forEach(col => {
      filteredRow[col] = row[col];
    });
    return filteredRow;
  }), { header: columnOrder });
 
  // Ajustar anchos de columnas
  newSheet['!cols'] = columnOrder.map(col => ({
    wch: col === 'nombre' ? 40 :
        col === 'Ganador TMP' || col === 'Ganador Tarjeta' ? 20 :
        col === 'Price Index TMP' || col === 'Price Index Tarjeta' ? 12 :
        col === 'KAM' ? 20 : 15
  }));

  const summaryData = [
    ["Resumen", "Valor"],
    ["Fecha y hora", fechaHoraEjecucion],
    ["Matches", filasConPriceIndex],
    ["Descompetitivos TMP", productosDescompetitivos],
    ["Descompetitivos Global", productosDescompetitivosGlobal],
    ["Quebrados", productosQuebrados]
  ];

  XLSX.utils.sheet_add_aoa(newSheet, summaryData, { 
    origin: { r: 0, c: columnOrder.length + 1 }
  });

  // Agregar información del desarrollador
  const developerInfo = [
    ["Desarrollado por:", "Germán Suárez"],
    ["Correo:", "gsuarez.cerpa@gmail.com"],
    ["LinkedIn:", "https://www.linkedin.com/in/germ%C3%A1n-andr%C3%A9-su%C3%A1rez-cerpa-a92b6b174/"]
  ];

  XLSX.utils.sheet_add_aoa(newSheet, developerInfo, {
    origin: {
      r: summaryData.length + 2,
      c: columnOrder.length + 1
    }
  });

  // Guardar archivo final
  XLSX.utils.book_append_sheet(newWorkbook, newSheet, 'Resultados');
  XLSX.writeFile(newWorkbook, 'resultados electro hogar.xlsx');
 
  console.log(`
    Proceso completado:
    - Archivo generado: resultados electro hogar.xlsx
    - Matches: ${filasConPriceIndex}
    - Productos descompetitivos TMP: ${productosDescompetitivos}
    - Productos descompetitivos Tarjeta: ${productosDescompetitivosTarjeta}
    - Hora real de registro: ${fechaHoraEjecucion}
  `);
}

// Iniciar el proceso
main().catch(err => {
  console.error('Error durante la ejecución:', err);
  process.exit(1);
});