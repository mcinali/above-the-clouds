const express = require('express')
const cors = require('cors')
const { pgMigrate } = require('./pg_migrations')

const app = express()
app.use(cors())
app.use(express.json())

const hostname = '0.0.0.0';
const port = 8080;

app.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`)
})

// RUN DB migrations
pgMigrate()