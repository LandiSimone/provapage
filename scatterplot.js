const classColors = {
  'neoplastic': '#ff7f0e',
  'aphthous': '#FFD700',
  'traumatic': '#1f77b4'
};

// Importa la libreria per la PCA
const { PCA } = ML;

// Funzione per ottenere il colore in base all'id del label
function getColor(labelId) {
  const colors = ['#ff7f0e', '#FFD700', '#1f77b4'];
  return colors[labelId % 3];
}

// Funzione per standardizzare le feature
function standardize(features) {
const means = features[0].map((_, colIndex) => {
  const column = features.map(row => row[colIndex]);
  const mean = column.reduce((acc, val) => acc + val, 0) / column.length;
  return mean;
});

const stdDevs = features[0].map((_, colIndex) => {
  const column = features.map(row => row[colIndex]);
  const mean = means[colIndex];
  const variance = column.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / column.length;
  return Math.sqrt(variance);
});

return features.map(row => row.map((val, colIndex) => (val - means[colIndex]) / stdDevs[colIndex]));
}

// Funzione per caricare e elaborare un singolo file CSV
function loadAndProcessCSVFile(csvURL, modelName, divID, casiAncora) {
  fetch(csvURL)
    .then(response => response.text())
    .then(csvData => processData(csvData, modelName, divID, casiAncora))
    .catch(error => console.error('Errore durante il caricamento del file CSV:', error));
}

// Funzione per elaborare i dati CSV e creare il plot
function processData(csvData, modelName, divID, casiAncora) {
  const featuresData = [];
  const rows = csvData.split('\n');
  
  for (let i = 1; i < rows.length - 1; i++) {
    const row = rows[i];
    const values = row.split(',');
    const features = values.slice(0, 64).map(parseFloat); // Prendi solo le prime 64 features
    const imageId = values[64];
    const labelId = values[65];
    const imageName = values[66]; // Nome del file dell'immagine

    const anchorCases = {};
    const headerRow = rows[0].split(','); // Ottieni l'intestazione divisa per virgole
    for (let j = 67; j < headerRow.length; j++) {
      const columnName = headerRow[j]; // Ottieni il nome della colonna
      anchorCases[columnName] = values[j];
    }
    //const imagePath = `oral1/${imageName}`; // Percorso dell'immagine relativa
    featuresData.push({ features, imageId, labelId, imageName, anchorCases });
  }
  createPlot(featuresData, modelName, divID, casiAncora);

}

// Funzione per creare il plot
function createPlot(featuresData, modelName, divID, casiAncora) {
  // Estrai solo le features per la PCA
  const features = featuresData.map(data => data.features);

  // Standardizzazione delle features
  const standardFeatures = standardize(features);

  // Crea un'istanza di PCA e addestrala sui dati standardizzati
  const pca = new PCA(standardFeatures);

  // Estrai le prime due componenti principali
  const projection = pca.predict(standardFeatures);
  const firstComponent = projection.getColumnVector(0).to1DArray();
  const secondComponent = projection.getColumnVector(1).to1DArray();

  // Crea il tracciato per lo scatter plot
  const trace = {
    x: firstComponent,
    y: secondComponent,
    mode: 'markers',
    text: featuresData.map(data => `Image ID: ${data.imageId}`), // Aggiungi l'ID dell'immagine come testo per ogni punto
    marker: { color: featuresData.map(data => getColor(data.labelId)),
      size: 10, // Assegna un colore in base all'id del label
      line: { // Imposta il bordo dei pallini per i valori presenti in 'Casi Ancora'
        color: featuresData.map(data => {
          const imageName = data.imageName.trim();
          // Restituisci il colore viola per i casi ancora, nessun bordo altrimenti
          return casiAncora.some(caso => caso.imageName === imageName) ? '#9400D3' : 'transparent';}),
          width: 2 // Larghezza del bordo
      }
    },
    type: 'scatter',
    hoverinfo: 'text',
    hoverlabel: { bgcolor: 'white', bordercolor: 'black' }
  };

  /*trace.on = {
    click: function(event) {
      // Mostra l'immagine selezionata
      const pointIndex = event.points[0].pointIndex;
      const imagePath = featuresData[pointIndex].imagePath;
      document.getElementById('imageContainer').innerHTML = `<img src="${imagePath}" alt="Selected Image">`;
    }
  };*/

  // Trova i valori minimi e massimi delle componenti principali
  const minX = Math.min(...firstComponent);
  const maxX = Math.max(...firstComponent);
  const minY = Math.min(...secondComponent);
  const maxY = Math.max(...secondComponent);

  // Calcola la variazione dei dati
  const deltaX = maxX - minX;
  const deltaY = maxY - minY;

  // Imposta i range degli assi con un margine aggiuntivo per una migliore visualizzazione
  const xAxisRange = [minX - 0.2 * deltaX, maxX + 0.2 * deltaX];
  const yAxisRange = [minY - 0.1 * deltaY, maxY + 0.1 * deltaY];

  // Crea il layout per il grafico
  const layout = {
    title: modelName,
    autosize: true, // Abilita il ridimensionamento automatico
    margin: { t: 50, b: 100, l: 70, r: 70 }, // Imposta i margini del plot
    height: 600,
    xaxis: { title: 'First Principal Component', range: xAxisRange },
    yaxis: { title: 'Second Principal Component', range: yAxisRange },
    annotations: [
      {
        x: 1,
        y: 1,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'left',
        yanchor: 'middle',
        text: 'neoplastic',
        showarrow: false,
        bgcolor: classColors['neoplastic'],
        font: { family: 'Arial, sans-serif', size: 12, color: '#000' },
        bordercolor: '#000',
        borderwidth: 1,
        borderpad: 4,
        opacity: 0.8
      },
      {
        x: 1,
        y: 0.9,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'left',
        yanchor: 'middle',
        text: 'aphthous',
        showarrow: false,
        bgcolor: classColors['aphthous'],
        font: { family: 'Arial, sans-serif', size: 12, color: '#000' },
        bordercolor: '#000',
        borderwidth: 1,
        borderpad: 4,
        opacity: 0.8
      },
      {
        x: 1,
        y: 0.8,
        xref: 'paper',
        yref: 'paper',
        xanchor: 'left',
        yanchor: 'middle',
        text: 'traumatic',
        showarrow: false,
        bgcolor: classColors['traumatic'],
        font: { family: 'Arial, sans-serif', size: 12, color: '#000' },
        bordercolor: '#000',
        borderwidth: 1,
        borderpad: 4,
        opacity: 0.8
      }
    ]
  };

  /*----------------------------*/
  // Inizializza un array vuoto per contenere tutte le shape delle frecce
  const allArrowShapes = [];
  const totalColumns = Object.keys(featuresData[0].anchorCases).length;
  // array per contenere il numero di frecce per ogni immagine ancora
  const arrowCount = [];

  // Calcola le coordinate x e y del punto di ogni immagine ancora
  for (let j = 0; j < totalColumns; j++) {
    const ColumnName = Object.keys(featuresData[0].anchorCases)[j];
    const indexAnchor = featuresData.findIndex(data => data.imageName === ColumnName);
    const xAnchor = firstComponent[indexAnchor];
    const yAnchor = secondComponent[indexAnchor];

    // Trova gli indici delle immagini con anchorCases diverso da 0
    const indicesWithNonZeroAnchorCase = featuresData.reduce((acc, data, index) => {
      if (data.anchorCases[ColumnName] > 0) { // Aggiungi questa condizione
        // calcola la distanza euclidea tra il punto e il punto ancora
        acc.push(index);
      }
      return acc;
    }, []);

    const startColor = 'rgb(0, 255, 0)'; // Verde
    const endColor = 'rgb(255, 0, 0)'; // Rosso
    // Calcola il gradiente di colore tra il colore di partenza e il colore di arrivo
    const colorScale = d3.scaleLinear()
      .domain([1, 20])
      .range([startColor, endColor]);

    // Crea le shape delle frecce
    const arrowShapes = indicesWithNonZeroAnchorCase.map((index) => ({
      type: 'line',
      x0: firstComponent[index],
      y0: secondComponent[index],
      x1: xAnchor,
      y1: yAnchor,
      line: {
        color: colorScale(parseFloat(featuresData[index].anchorCases[ColumnName])), // Usa il gradiente di colore
        width: 1,
        dash: 'solid'
      },
    }));

    const arrowShapesCount = arrowShapes.length;
    arrowCount.push(arrowShapesCount);

    // Concatena le shape delle frecce della colonna corrente con l'array delle frecce totali
    allArrowShapes.push(...arrowShapes);
  }
  /*-----------------------------*/

  // crea un pulsante per ogni anchor case per selezionare o deselezionare le frecce
  const buttonContainer = document.getElementById(`${divID}_Button`);
  buttonContainer.innerHTML = '';
  const textNode3 = document.createTextNode(`Anchor Cases:`);
  buttonContainer.appendChild(textNode3);
  buttonContainer.appendChild(document.createElement('br'));
  for (let j = 0; j < totalColumns; j++) {
    const ColumnName = Object.keys(featuresData[0].anchorCases)[j];
    const button = document.createElement('button');
    button.textContent = ColumnName;
    buttonContainer.appendChild(button);
    buttonContainer.appendChild(document.createElement('br'));
  }
  
  // Aggiungi un evento click a tutti i pulsanti ancora
  const ancoraButtons = buttonContainer.getElementsByTagName('button');
  let allArrowShapesCopy = allArrowShapes;
  for (let j = 0; j < ancoraButtons.length; j++) {
    ancoraButtons[j].addEventListener('click', function() {
      this.style.backgroundColor = 'green';
      // disattiva tutti gli altri pulsanti
      for (let k = 0; k < ancoraButtons.length; k++) {
        if (k !== j) {
          ancoraButtons[k].style.backgroundColor = '';
        }
      }
      
      let startIndex = 0;
      for (let k = 0; k < j; k++) {
        startIndex += arrowCount[k];
      }
      let endIndex = startIndex + arrowCount[j];
      // Mantieni solo gli elementi compresi tra startIndex e endIndex
      const newArrowShapes = allArrowShapesCopy.slice(startIndex, endIndex);
      allArrowShapesCopy = newArrowShapes;

      // Aggiorna il layout con le nuove shape delle frecce
      layout.shapes = allArrowShapesCopy;
      allArrowShapesCopy = allArrowShapes;

      // Aggiorna il grafico con le nuove shape delle frecce
      Plotly.update(divID, [trace], layout);
    });
  }

  // Crea il grafico con Plotly e associa l'evento di click al tracciato
  Plotly.newPlot(divID, [trace], layout, { displayModeBar: true }).then(gd => {
    gd.on('plotly_click', function(eventData) {
      const pointIndex = eventData.points[0].pointIndex;
      const fileName = featuresData[pointIndex].imageName; // Nome del file dell'immagine
      const folderURL = 'https://unipiit-my.sharepoint.com/personal/s_landi19_studenti_unipi_it/_layouts/15/onedrive.aspx?id=%2Fpersonal%2Fs%5Flandi19%5Fstudenti%5Funipi%5Fit%2FDocuments%2Foral1%2F'; // URL della cartella contenente le immagini
      const parentParam = '&parent=%2Fpersonal%2Fs_landi19_studenti_unipi_it%2FDocuments%2Foral1'; // Parametro parent
      const imagePath = `${folderURL}${fileName}${parentParam}`;
      const imageId = featuresData[pointIndex].imageId;
      const xCoordinate = firstComponent[pointIndex].toFixed(6);
      const yCoordinate = secondComponent[pointIndex].toFixed(6);
      const imageContainer = document.getElementById(`${divID}_image`);

      // Crea il link per visualizzare l'immagine
      imageContainer.innerHTML = '';
      const linkElement = document.createElement('a');
      linkElement.href = imagePath;
      linkElement.target = '_blank';
      linkElement.textContent = `Click here to view the image`;

      // Aggiungi il link all'elemento imageContainer
      imageContainer.appendChild(linkElement);
      imageContainer.appendChild(document.createElement('br'));

      // Aggiungi la parte delle coordinate e dell'ID come testo normale
      const textNode1 = document.createTextNode(`Image ID: ${imageId}`);
      imageContainer.appendChild(textNode1);
      imageContainer.appendChild(document.createElement('br'));
      const textNode2 = document.createTextNode(`Coordinates: (${xCoordinate},${yCoordinate})`);
      imageContainer.appendChild(textNode2);
      imageContainer.appendChild(document.createElement('br'));
    
    });
  });
  
  
}


const local = false;

function changeModel() {
  var selectBox = document.getElementById("modelSelect");
  var model = selectBox.options[selectBox.selectedIndex].value;
  var csvURL = getCsvURL(model);
  
  // Elabora casi ancora
  var ancoraURL = getCsvURL('Ancora');
  fetch(ancoraURL)
    .then(response => response.text())
    .then(csvData => {
      // Divide il file CSV in righe e estrae i valori della colonna 'CASI ANCORA' e 'TIPO DI ULCERA' 
      const rows = csvData.split('\n');
      const casiAncora = rows.slice(1).map(row => {
        const columns = row.split(',');
        const imageName = columns[0];
        const ulcerType = columns[1];
        return { imageName, ulcerType};
      });
      casiAncora.pop(); // Rimuovi l'ultimo elemento vuoto
          
      // Chiamata a loadAndProcessCSVFile all'interno della funzione fetch per rankURL
      loadAndProcessCSVFile(csvURL, model, 'myDiv', casiAncora);
    })
    .catch(error => console.error('Errore durante il caricamento del file casi_ancora.csv:', error));  

  var imageContainer = document.getElementById("myDiv_image");
  if (modelSelect.value !== "") {
    imageContainer.style.display = "block";
  } else {
    imageContainer.style.display = "none";
  }
}

function getCsvURL(model) {
  if (local) {
    return `http://localhost:8080/features/${getModelFileName(model)}.csv`;
  } else {
    return `features/${getModelFileName(model)}.csv`;
  }
}

function getModelFileName(model) {
  switch (model) {
    case 'ConvNeXt Small':
      return 'merged_convnext_small_classifier';
    case 'SqueezeNet 1_0':
      return 'merged_squeezenet1_0_classifier';
    case 'ViT B_16':
      return 'merged_vit_b_16_heads';
    case 'Swin S':
      return 'merged_swin_s_head';
    case 'Ancora':
      return 'casi_ancora';
    default:
      return '';
  }
}

