const { pool, pgTransaction } = require('../pg_helpers')

async function insertConnection(connectionInfo){
  try {
    const { accountId, connectionAccountId  } = connectionInfo
    const query = `
      INSERT INTO connections (account_id, connection_account_id)
      VALUES (${accountId}, ${connectionAccountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function removeConnection(connectionInfo){
  try {
    const { accountId, connectionAccountId  } = connectionInfo
    const query = `DELETE FROM connections WHERE account_id = ${accountId} and connection_account_id = ${connectionAccountId}`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountConnections(accountId){
  try {
    const query = `SELECT id, connection_account_id, created_at FROM connections WHERE account_id = ${accountId}`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getConnectionsToAccount(connectionAccountId){
  try {
    const query = `SELECT id, account_id, created_at FROM connections WHERE connection_account_id = ${connectionAccountId}`
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
    const { accountId, connectionAccountId } = info
    const query = `SELECT * FROM connections WHERE account_id = ${accountId} AND connection_account_id = ${connectionAccountId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertConnection,
  removeConnection,
  getAccountConnections,
  getConnectionsToAccount,
  checkConnection,
}
