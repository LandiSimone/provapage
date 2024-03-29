const classColors = {
    'neoplastic': '#ff7f0e',
    'aphthous': '#2ca02c',
    'traumatic': '#1f77b4'
  };
  
  // Importa la libreria per la PCA
  const { PCA } = ML;
  
  // Funzione per ottenere il colore in base all'id del label
  function getColor(labelId) {
    const colors = ['#ff7f0e', '#2ca02c', '#1f77b4'];
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
  function loadAndProcessCSVFile(csvURL, modelName, divID) {
    fetch(csvURL)
      .then(response => response.text())
      .then(csvData => processData(csvData, modelName, divID))
      .catch(error => console.error('Errore durante il caricamento del file CSV:', error));
  }
  
  // Funzione per elaborare i dati CSV e creare il plot
  function processData(csvData, modelName, divID) {
    const featuresData = [];
    const rows = csvData.split('\n');
    for (let i = 1; i < rows.length - 1; i++) {
      const row = rows[i];
      const values = row.split(',');
      const features = values.slice(0, 64).map(parseFloat); // Prendi solo le prime 64 features
      const imageId = values[64];
      const labelId = values[65];
      const imageName = values[66]; // Nome del file dell'immagine
      const imagePath = `oral1/${imageName}`; // Percorso dell'immagine relativa
      featuresData.push({ features, imageId, labelId, imagePath });
    }
    createPlot(featuresData, modelName, divID);
  }
  
  // Funzione per creare il plot
  function createPlot(featuresData, modelName, divID) {
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
                size: 10 }, // Assegna un colore in base all'id del label
      type: 'scatter',
    };
  
    /*trace.on = {
      click: function(event) {
        // Mostra l'immagine selezionata
        const pointIndex = event.points[0].pointIndex;
        const imagePath = featuresData[pointIndex].imagePath;
        document.getElementById('imageContainer').innerHTML = `<img src="${imagePath}" alt="Selected Image">`;
      }
    };*/

    // Crea il layout per il grafico
    const layout = {
      title: modelName,
      xaxis: { title: 'First Principal Component' },
      yaxis: { title: 'Second Principal Component' },
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
  
    // Crea il grafico con Plotly e associa l'evento di click al tracciato
    Plotly.newPlot(divID, [trace], layout, { displayModeBar: true }).then(gd => {
      gd.on('plotly_click', function(eventData) {
        const pointIndex = eventData.points[0].pointIndex;
        const imagePath = featuresData[pointIndex].imagePath;
        const imageId = featuresData[pointIndex].imageId;
        const xCoordinate = firstComponent[pointIndex].toFixed(6);
        const yCoordinate = secondComponent[pointIndex].toFixed(6);
        const imageContainer = document.getElementById(`${divID}_image`);
        imageContainer.innerHTML = `(${xCoordinate},${yCoordinate}) ImageID:${imageId}<br><img src="${imagePath}" alt="Selected Image" style="max-width: 200px; max-height: 200px;">`;
      });
    });    
    
  }
  
  // Carica e elabora i file CSV desiderati
  loadAndProcessCSVFile('features/convnext_small_classifier.csv', 'ConvNeXt Small', 'myDiv1');
  loadAndProcessCSVFile('features/squeezenet1_0_classifier.csv', 'SqueezeNet 1_0', 'myDiv2');
  loadAndProcessCSVFile('features/vit_b_16_heads.csv', 'ViT B_16', 'myDiv3');
  loadAndProcessCSVFile('features/swin_s_head.csv', 'Swin S', 'myDiv4');