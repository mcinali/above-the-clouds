const { pool, pgTransaction } = require('../pg_helpers')

async function insertOnlineBroadcast(broadcastInfo){
  try {
    const { accountId, broadcastAccountId } = broadcastInfo
    const query = `
      INSERT INTO online_broadcasts (account_id, broadcast_account_id)
      VALUES (${accountId}, ${broadcastAccountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getRecentOnlineBroadcasts(lookupInfo){
  try {
    const { accountId, lookbackHours } = lookupInfo
    const query = `
      SELECT * FROM online_broadcasts where account_id = ${accountId} AND created_at + INTERVAL '${lookbackHours} hour' > now()`
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertOnlineBroadcast,
  getRecentOnlineBroadcasts,
}
