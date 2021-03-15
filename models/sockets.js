const { pool, pgTransaction } = require('../pg_helpers')

async function insertSocketConnection(socketConnectionInfo){
  try {
    const { accountId, socketId } = socketConnectionInfo
    const query = `
      INSERT INTO socket_connections (account_id, socket_id)
      VALUES ('${accountId}', '${socketId}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getActiveAccountSocketConnections(accountId){
  try {
    const query = `
      SELECT * FROM socket_connections
      WHERE account_id = ${accountId} AND end_time IS null`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getRecentAccountSocketConnections(accountId, ttl){
  try {
    const query = `
      SELECT * FROM socket_connections
      WHERE account_id = ${accountId} AND created_at + INTERVAL '${ttl} hour' > now()`
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
      UPDATE socket_connections SET end_time = now() WHERE account_id = ${accountId} AND socket_id = '${socketId}'
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertSocketConnection,
  getActiveAccountSocketConnections,
  getRecentAccountSocketConnections,
  updateSocketDisconnection,
}
