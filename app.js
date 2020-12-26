const express = require('express')
const cors = require('cors')
const { pgMigrate } = require('./pg_migrations')
const accounts = require('./routes/accounts')
const topics = require('./routes/topics')
const streams = require('./routes/streams')
const connections = require('./routes/connections')

const app = express()
app.use(cors())
app.use(express.json())
app.use('/account', accounts)
app.use('/topic', topics)
app.use('/stream', streams)
app.use('/connections', connections)

const hostname = '0.0.0.0';
const port = 8080;

app.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`)
})

// RUN DB migrations
pgMigrate()
