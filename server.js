const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
//const open = require('open');

const corsOptions = {
  origin: '*', // Consenti richieste da qualsiasi origine
  methods: ['GET', 'POST'], // Consenti solo i metodi GET e POST
};

const server = http.createServer((req, res) => {
    cors(corsOptions)(req, res, () => {
        // Verifica se la richiesta è per un file CSV e il metodo è GET
        if (req.method === 'GET' && req.url.startsWith('/features/') && req.url.endsWith('.csv')) {
          // Percorso del file CSV
          const fileName = req.url.split('/').pop(); // Ottieni il nome del file dalla richiesta
          const filePath = path.join(__dirname, 'features', fileName);
      
      // Leggi il file CSV
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error('Errore durante la lettura del file CSV:', err);
          res.writeHead(500);
          res.end('Internal Server Error');
        } else {
          // Imposta l'header CORS nella risposta
          res.setHeader('Access-Control-Allow-Origin', '*');
          // Invia il contenuto del file CSV come risposta
          res.writeHead(200, { 'Content-Type': 'text/csv' });
          res.end(data);
        }
      });
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });
});

const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  // Esegui un comando per aprire il file nel browser predefinito
  exec('open plot.html', (err, stdout, stderr) => {
    if (err) {
      console.error('Errore durante l\'apertura di plot.html nel browser:', err);
      return;
    }
    console.log('Il file plot.html è stato aperto nel browser.');
  });
});
