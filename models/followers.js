const { pool, pgTransaction } = require('../pg_helpers')

async function insertFollower(followerInfo){
  try {
    const { accountId, followerAccountId  } = followerInfo
    const query = `
      INSERT INTO followers (account_id, follower_account_id)
      VALUES (${accountId}, ${followerAccountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function removeFollower(followerInfo){
  try {
    const { accountId, followerAccountId  } = followerInfo
    const query = `DELETE FROM followers WHERE account_id = ${accountId} and follower_account_id = ${followerAccountId}`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountFollowing(accountId){
  try {
    const query = `SELECT account_id FROM followers WHERE follower_account_id = ${accountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountFollowers(accountId){
  try {
    const query = `SELECT follower_account_id as account_id FROM followers WHERE account_id = ${accountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}



module.exports = {
  insertFollower,
  removeFollower,
  getAccountFollowing,
  getAccountFollowers,
}
