const { pool, pgTransaction } = require('../pg_helpers')

async function insertConnection(connectionInfo){
  try {
    const { accountId, connectionId  } = connectionInfo
    const query = `
      INSERT INTO connections (account_id, connection_id)
      VALUES (${accountId}, ${connectionId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function removeConnection(connectionInfo){
  try {
    const { accountId, connectionId  } = connectionInfo
    const query = `DELETE FROM connections WHERE account_id = ${accountId} and connection_id = ${connectionId}`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function insertConnectionEmailOutreach(connectionInfo){
  try {
    const { accountId, connectionEmail  } = connectionInfo
    const query = `
      INSERT INTO connections_email_outreach (account_id, connection_email)
      VALUES (${accountId}, '${connectionEmail}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountConnections(accountId){
  try {
    const query = `SELECT id, connection_id, created_at FROM connections WHERE account_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getConnectionsToAccount(accountId){
  try {
    const query = `SELECT id, account_id, created_at FROM connections WHERE connection_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function checkConnection(info){
  try {
    const { accountId, connectionId } = info
    const query = `SELECT * FROM connections WHERE account_id = ${accountId} AND connection_id = ${connectionId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountConnectionsEmailOutreach(accountId){
  try {
    const query = `SELECT id, connection_email, created_at FROM connections_email_outreach WHERE account_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getConnectionsEmailOutreachToAccount(accountEmail){
  try {
    const query = `SELECT id, account_id, created_at FROM connections_email_outreach WHERE connection_email = '${accountEmail}'`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertConnection,
  removeConnection,
  insertConnectionEmailOutreach,
  getAccountConnections,
  getConnectionsToAccount,
  checkConnection,
  getAccountConnectionsEmailOutreach,
  getConnectionsEmailOutreachToAccount,
}
