const env = process.env.NODE_ENV
const fs = require('fs')
const { GCP_POSTGRES_PASSWORD } = require('./secrets')

// Local DB configuration
const localDB = {
  host: 'localhost',
  user: 'mcinali',
  password: null,
  database: 'above_the_clouds',
  port: 5432,
}
// GCP DB configuration
const gcpDB = {
  user: 'backend',
  password: GCP_POSTGRES_PASSWORD,
  database: 'above-the-clouds',
  host: 'localhost',
  port: 5432,
}
// Set db variable
const db = (env=='prod') ? gcpDB : localDB

// Set webURL variable
const webURL = (env=='prod') ? 'https://www.abovethecloudsapp.com' : 'http://localhost:3000'
const corsURL = (env=='prod') ? /abovethecloudsapp\.com$/ : 'http://localhost:3000'

module.exports = {
  db,
  webURL,
  corsURL,
}
