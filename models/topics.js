const { pool, pgTransaction, freeTextFormatter } = require('../pg_helpers')

async function insertTopic(info){
  try {
    const { accountId, topic } = info
    const query = `
      INSERT INTO topics (account_id, topic)
      VALUES (${accountId}, ${freeTextFormatter(topic)})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getTopicInfo(topicId){
  try {
    const query = `SELECT * FROM topics WHERE id = ${topicId}`
    return pool
            .query(query)
            .then(res => res.rows[0])
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getRecentTopics(lookbackPeriod){
  try {
    const query = `SELECT * FROM topics WHERE created_at + INTERVAL '${lookbackPeriod} hours' >= now()`
    console.log(query)
    return pool
            .query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  insertTopic,
  getTopicInfo,
  getRecentTopics,
}
