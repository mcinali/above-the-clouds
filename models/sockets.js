const { pool, pgTransaction } = require('../pg_helpers')

async function insertSocketConnection(socketConnectionInfo){
  try {
    const { accountId, socketId } = socketConnectionInfo
    const query = `
      INSERT INTO socket_connections (account_id, socket_id, connected)
      VALUES ('${accountId}', '${socketId}', true)
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountSocketConnections(accountId, ttl){
  try {
    const query = `
      SELECT * FROM socket_connections
      WHERE account_id = ${accountId} AND connected = true AND created_at + INTERVAL '${ttl} hour' > now()`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function updateSocketDisconnection(socketDisconnectionInfo){
  try {
    const { accountId, socketId } = socketDisconnectionInfo
    const query = `
      UPDATE socket_connections SET connected = false WHERE account_id = ${accountId} AND socket_id = '${socketId}'
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertSocketConnection,
  getAccountSocketConnections,
  updateSocketDisconnection,
}
