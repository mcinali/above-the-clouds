const { pool, pgTransaction } = require('../pg_helpers')

async function insertFollower(followerInfo){
  try {
    const { accountId, followerAccountId  } = followerInfo
    const query = `
      INSERT INTO follows (account_id, follower_account_id)
      VALUES (${accountId}, ${followerAccountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function checkFollowerStatus(followerInfo){
  try {
    const { accountId, followerAccountId  } = followerInfo
    const query = `SELECT unfollow FROM follows WHERE account_id = ${accountId} and follower_account_id = ${followerAccountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function updateFollowerStatus(followerInfo){
  try {
    const { accountId, followerAccountId, unfollow } = followerInfo
    const query = `UPDATE follows SET unfollow = ${unfollow} WHERE account_id = ${accountId} and follower_account_id = ${followerAccountId} RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountFollowing(accountId){
  try {
    const query = `SELECT account_id FROM follows WHERE follower_account_id = ${accountId} AND (unfollow != true OR unfollow is null)`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountFollowers(accountId){
  try {
    const query = `SELECT follower_account_id as account_id FROM follows WHERE account_id = ${accountId} AND (unfollow != true OR unfollow is null)`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}



module.exports = {
  insertFollower,
  checkFollowerStatus,
  updateFollowerStatus,
  getAccountFollowing,
  getAccountFollowers,
}
