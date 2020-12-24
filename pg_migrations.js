const { pgTransaction } = require('./pg_helpers')

async function pgMigrate(){
  await pgTransaction(`ALTER DATABASE above_the_clouds SET timezone TO 'GMT'`)

  await pgTransaction(
    `CREATE TABLE iF NOT EXISTS accounts (
      id SERIAL PRIMARY KEY NOT NULL,
      username VARCHAR(32) UNIQUE NOT NULL,
      password BYTEA NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS account_details (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      email VARCHAR(128) UNIQUE NOT NULL,
      phone BIGINT UNIQUE NOT NULL,
      firstname VARCHAR(32) NOT NULL,
      lastname VARCHAR(32) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      topic VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS streams (
      id SERIAL PRIMARY KEY NOT NULL,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      creator_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS thread_invitations (
      id SERIAL PRIMARY KEY NOT NULL,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      inviter_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      invitee_account_id INTEGER REFERENCES accounts(id) ON DELETE CASCADE,
      invitee_email VARCHAR(128),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT unique_thread_id_moderator_id_invitee_email UNIQUE (thread_id, inviter_account_id, invitee_account_id, invitee_email)
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS thread_activity (
      id SERIAL PRIMARY KEY NOT NULL,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS displayed_threads (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )
}

module.exports = {
  pgMigrate,
}
