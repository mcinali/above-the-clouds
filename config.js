const env = process.env.NODE_ENV
const fs = require('fs')
const { GCP_POSTGRES_PASSWORD } = require('./secrets')

const localDB = {
  host: 'localhost',
  user: 'mcinali',
  password: null,
  database: 'above_the_clouds',
  port: 5432,
}

const gcpDB = {
  user: 'backend',
  password: GCP_POSTGRES_PASSWORD,
  database: 'above-the-clouds',
  host: 'localhost',
  port: 5432,
}

const db = (env=='prod') ? gcpDB : localDB
const webURL = (env=='prod') ? 'https://www.abovethecloudsapp.com' : 'http://localhost:3000'

module.exports = {
  db,
  webURL,
}
