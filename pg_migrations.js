const { pgTransaction } = require('./pg_helpers')

async function pgMigrate(){
  await pgTransaction(
    `CREATE TABLE iF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY NOT NULL,
      username VARCHAR(32) UNIQUE NOT NULL,
      password BYTEA NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS accounts_details (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      email VARCHAR(128) UNIQUE NOT NULL,
      phone BIGINT UNIQUE NOT NULL,
      firstname VARCHAR(32) NOT NULL,
      lastname VARCHAR(32) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )

  // await pgTransaction(
  //   `CREATE TABLE IF NOT EXISTS access_tokens (
  //     id SERIAL PRIMARY KEY NOT NULL,
  //     account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id),
  //     token BYTEA NOT NULL,
  //     expiration TIMESTAMP NOT NULL,
  //     created_at TIMESTAMP NOT NULL DEFAULT now()
  //   )`
  // )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS questions (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      question VARCHAR(64) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT now()
    )`
  )
}

module.exports = {
  pgMigrate,
}
