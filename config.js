const env = process.env.NODE_ENV
const webURL = process.env.WEB_URL
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD
const fs = require('fs')

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
  password: POSTGRES_PASSWORD,
  database: 'above-the-clouds',
  host: 'localhost',
  port: 5432,
}
// Set db variable
const db = (env=='prod' || env=='staging') ? gcpDB : localDB

// Set corsURL variable
const corsURL = (env=='prod' || env=='staging') ? /abovethecloudsapp\.com$/ : 'http://localhost:3000'

module.exports = {
  db,
  webURL,
  corsURL,
}
