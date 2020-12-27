const { Pool } = require('pg')
const pg = require('pg')
const pgCamelCase = require('pg-camelcase')
const revertCamelCase = pgCamelCase.inject(pg)

const db = {
  user: 'mcinali',
  host: 'localhost',
  database: 'above_the_clouds',
  password: null,
  port: 5432,
}

const pool = new Pool(db)

async function pgTransaction(text, values = []) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await client.query(text, values)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    console.error(err.stack)
  } finally {
    client.release()
  }
}

function freeTextFormatter(text){
  try {
    const textFormatted = text.replace("'","''")
    return `'${textFormatted}'`
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  pool,
  pgTransaction,
  freeTextFormatter,
}
