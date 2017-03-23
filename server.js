const fs = require('fs');
const https = require('https');
const express = require('express');
const PORT = 8000;
const root = `${__dirname}/dist`;
const app = express();

https.createServer({
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
  passphrase: 'supersecret'
}, app).listen(PORT);

app.use(express.static(root));

console.log('Running on https://localhost:' + PORT);
