const { pgTransaction } = require('./pg_helpers')
const { db } = require('./config')

async function pgMigrate(){
  try {
    await pgTransaction(`ALTER DATABASE "${db.database}" SET timezone TO 'GMT'`)

    await pgTransaction(
      `CREATE TABLE iF NOT EXISTS registration_email_access_codes (
        id SERIAL PRIMARY KEY NOT NULL,
        email VARCHAR(128) NOT NULL,
        access_code VARCHAR(6) NOT NULL,
        access_code_expiration TIMESTAMPTZ NOT NULL,
        access_token BYTEA NOT NULL,
        access_token_expiration TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )

    await pgTransaction(
      `CREATE TABLE iF NOT EXISTS registration_phone_access_codes (
        id SERIAL PRIMARY KEY NOT NULL,
        phone BIGINT NOT NULL,
        access_code VARCHAR(6) NOT NULL,
        access_code_expiration TIMESTAMPTZ NOT NULL,
        access_token BYTEA NOT NULL,
        access_token_expiration TIMESTAMPTZ NOT NULL,
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
      `CREATE TABLE iF NOT EXISTS access_tokens (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        access_token BYTEA NOT NULL,
        access_token_expiration TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS password_reset (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        reset_code BYTEA UNIQUE NOT NULL,
        reset_token BYTEA NOT NULL,
        verification_code BYTEA NOT NULL,
        expiration TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL,
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
      `CREATE TABLE IF NOT EXISTS account_profile_pictures (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        profile_picture BYTEA NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS app_invitations (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        email VARCHAR(128) NOT NULL,
        invitation_code BYTEA NOT NULL,
        invitation_code_expiration TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS app_invitation_conversions (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER UNIQUE NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        invitation_code_id INTEGER UNIQUE NOT NULL REFERENCES app_invitations(id) ON DELETE CASCADE,
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
        invite_only BOOLEAN NOT NULL DEFAULT false,
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
      `CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        following_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        unfollow BOOLEAN,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (account_id, following_account_id)
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS socket_connections (
        id SERIAL PRIMARY KEY NOT NULL,
        socket_id VARCHAR(32) NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        end_time TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE (socket_id, account_id)
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS online_broadcasts (
        id SERIAL PRIMARY KEY NOT NULL,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        broadcast_account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )

    await pgTransaction(
      `CREATE TABLE IF NOT EXISTS stream_reminders (
        id SERIAL PRIMARY KEY NOT NULL,
        stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
        account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )`
    )
  } catch (error) {
    console.error(error)
  }

}

module.exports = {
  pgMigrate,
}
