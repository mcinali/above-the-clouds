const { pool, pgTransaction } = require('../pg_helpers')

async function insertTopic(info){
  try {
    const { accountId, topic } = info
    const query = `
      INSERT INTO topics (account_id, topic)
      VALUES (${accountId}, '${topic}')
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  insertTopic,
}
