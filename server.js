
const http = require('http');
const fs = require('fs');
const path = require('path');

// Port should be provided by Hostinger
const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.tsx': 'text/plain', // Babel needs this as text to transform it
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
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        fs.readFile(path.join(__dirname, 'index.html'), (err, indexContent) => {
          if (err) {
            res.writeHead(500);
            res.end('Critical Error: index.html missing');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(indexContent, 'utf-8');
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
  console.log(`Server running on port ${PORT}`);
});
