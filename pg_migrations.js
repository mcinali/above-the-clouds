const { pgTransaction } = require('./pg_helpers')

async function pgMigrate(){
  await pgTransaction(`ALTER DATABASE above_the_clouds SET timezone TO 'GMT'`)

  // TO DO: Re-write connections logic
  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS connections_email_outreach (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      connection_email VARCHAR(128) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (account_id, connection_email)
    )`
  )

  await pgTransaction(
    `CREATE TABLE iF NOT EXISTS registration_email_access_codes (
      id SERIAL PRIMARY KEY NOT NULL,
      email VARCHAR(128) NOT NULL,
      access_code INTEGER NOT NULL,
      access_token BYTEA NOT NULL,
      expired_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE iF NOT EXISTS registration_phone_access_codes (
      id SERIAL PRIMARY KEY NOT NULL,
      phone BIGINT NOT NULL,
      access_code INTEGER NOT NULL,
      access_token BYTEA NOT NULL,
      expired_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

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

  await pgTransaction(`
    DO $$
      BEGIN
        IF NOT EXISTS (select * from pg_type where typname = 'accessibility') THEN CREATE TYPE accessibility AS ENUM ('invite-only','network-only','public');
        END IF;
      END; $$
    LANGUAGE plpgsql`)

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS streams (
      id SERIAL PRIMARY KEY NOT NULL,
      topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
      creator_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      speaker_accessibility accessibility NOT NULL,
      capacity INTEGER NOT NULL,
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS stream_invitations (
      id SERIAL PRIMARY KEY NOT NULL,
      stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      invitee_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (stream_id, account_id, invitee_account_id)
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS stream_email_outreach (
      id SERIAL PRIMARY KEY NOT NULL,
      stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      invitee_email VARCHAR(128) NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (stream_id, account_id, invitee_email)
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS stream_participants (
      id SERIAL PRIMARY KEY NOT NULL,
      stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      start_time TIMESTAMPTZ NOT NULL DEFAULT now(),
      end_time TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`
  )

  await pgTransaction(
    `CREATE TABLE IF NOT EXISTS connections (
      id SERIAL PRIMARY KEY NOT NULL,
      account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      connection_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (account_id, connection_account_id)
    )`
  )
}

module.exports = {
  pgMigrate,
}
