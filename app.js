const express = require('express')
const cors = require('cors')
const CronJob = require('cron').CronJob
const { sendScheduledStreamReminders } = require('./services/streams')
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
const broadcasts = require('./routes/broadcasts')
const { establishSockets } = require('./sockets/sockets')
const app = express()
const http = require('http').createServer(app)
const { corsURL } = require('./config')
const io = require('socket.io')(http, {
  cors: {
    origin: corsURL,
    methods: ['GET']
  }
})

app.set('io', io)
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
app.use('/broadcast', broadcasts)

const hostname = '0.0.0.0';

app.listen(8080, hostname, () => {
  console.log(`App running on port 8080`)
})

http.listen(8000, hostname, () => {
  establishSockets(io)
  console.log(`Websockets listening on port 8000`)
})

// RUN DB migrations
pgMigrate()

// Scheduled Stream Reminder Cronjob
const job = new CronJob('45,15 * * * *', function () {
  sendScheduledStreamReminders(15)
}, null, true, 'America/Los_Angeles')
job.start()
