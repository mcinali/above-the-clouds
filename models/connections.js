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
    console.error(error.stack)
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
    console.error(error.stack)
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
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  insertConnection,
  removeConnection,
  insertConnectionEmailOutreach,
}
