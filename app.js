const express = require('express')
const cors = require('cors')
const { pgMigrate } = require('./pg_migrations')
const accounts = require('./routes/accounts')
const threads = require('./routes/threads')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/account', accounts)

const hostname = '0.0.0.0';
const port = 8080;

app.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`)
})

// RUN DB migrations
pgMigrate()
