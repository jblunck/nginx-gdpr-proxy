const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('<html><head></head><body>Hello World!</body><footer></footer></html>')
})

app.get('/identity', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(req.headers, null, 2));
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
