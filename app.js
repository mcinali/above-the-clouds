const express = require('express')
const cors = require('cors')
const { pgMigrate } = require('./pg_migrations')
const index = require('./routes/index')
const preregistration = require('./routes/preregistration')
const auth = require('./routes/auth')
const accounts = require('./routes/accounts')
const invitations = require('./routes/invitations')
const follows = require('./routes/follows')
const topics = require('./routes/topics')
const streams = require('./routes/streams')
const discovery = require('./routes/discovery')
const suggestions = require('./routes/suggestions')
const app = express()
const { establishSockets } = require('./sockets/sockets')
const http = require('http').createServer(app)
const { webURL } = require('./config')
const io = require('socket.io')(http, {
  cors: {
    origin: webURL,
    methods: ['GET']
  }
})

app.use(cors())
app.use(express.json())
app.use('/', index)
app.use('/preregistration', preregistration)
app.use('/auth', auth)
app.use('/account', accounts)
app.use('/invitation', invitations)
app.use('/follows', follows)
app.use('/topic', topics)
app.use('/stream', streams)
app.use('/discovery', discovery)
app.use('/suggestions', suggestions)

const hostname = '0.0.0.0';
const port = 8080;

app.listen(port, hostname, () => {
  console.log(`App running at http://${hostname}:${port}`)
})

http.listen(8000, () => {
  establishSockets(io)
  console.log(`Websockets listening on port 8000`)
})

// RUN DB migrations
pgMigrate()
