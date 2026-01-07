
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY || '';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.tsx': 'text/plain',
  '.ts': 'text/plain',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  let requestPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, requestPath === '/' ? 'index.html' : requestPath);
  
  const extname = String(path.extname(filePath)).toLowerCase();
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Critical Error: index.html missing');
          } else {
            // Inject the API key into the index.html on the fly
            let html = indexContent.toString();
            const injectedScript = `<script>window.process = { env: { API_KEY: '${API_KEY}' } };</script>`;
            html = html.replace('<head>', `<head>${injectedScript}`);
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html, 'utf-8');
          }
        });
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${error.code}`);
      }
    } else {
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} with API_KEY: ${API_KEY ? 'Present' : 'Missing'}`);
});
