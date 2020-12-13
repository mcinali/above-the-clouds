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

  // await pgTransaction(
  //   `CREATE TABLE IF NOT EXISTS access_tokens (
  //     id SERIAL PRIMARY KEY NOT NULL,
  //     account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id),
  //     token BYTEA NOT NULL,
  //     expiration TIMESTAMPTZ NOT NULL,
  //     created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  //   )`
  // )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS topics (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      topic VARCHAR(64) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS threads (
      id SERIAL PRIMARY KEY NOT NULL,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      private BOOLEAN NOT NULL,
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `DO $$
      BEGIN
        IF NOT EXISTS (select * from pg_type where typname = 'role_enum')
        THEN CREATE TYPE role_enum AS ENUM ('Moderator','Speaker','Audience');
      END IF;
      END;
      $$
      LANGUAGE plpgsql;`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS thread_participants (
      id SERIAL PRIMARY KEY NOT NULL,
      thread_id INTEGER NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      role role_enum NOT NULL,
      removed BOOLEAN NOT NULL DEFAULT False,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      CONSTRAINT unique_thread_id_account_id UNIQUE (thread_id, account_id)
    )`
  )
}

module.exports = {
  pgMigrate,
}
