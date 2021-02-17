const { pool, pgTransaction } = require('../pg_helpers')

async function insertFollow(followingInfo){
  try {
    const { accountId, followingAccountId  } = followingInfo
    const query = `
      INSERT INTO follows (account_id, following_account_id)
      VALUES (${accountId}, ${followingAccountId})
      RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function checkFollowStatus(followingInfo){
  try {
    const { accountId, followingAccountId  } = followingInfo
    const query = `SELECT unfollow FROM follows WHERE account_id = ${accountId} and following_account_id = ${followingAccountId}`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function updateFollowStatus(followingInfo){
  try {
    const { accountId, followingAccountId, unfollow } = followingInfo
    const query = `UPDATE follows SET unfollow = ${unfollow} WHERE account_id = ${accountId} and following_account_id = ${followingAccountId} RETURNING *`
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountsFollowing(accountId){
  try {
    const query = `SELECT following_account_id as account_id FROM follows WHERE account_id = ${accountId} AND (unfollow != true OR unfollow is null)`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}

async function getAccountFollowers(accountId){
  try {
    const query = `SELECT account_id FROM follows WHERE following_account_id = ${accountId} AND (unfollow != true OR unfollow is null)`
    return pool.query(query)
            .then(res => res.rows)
            .catch(error => new Error(error))
  } catch (error) {
    throw new Error(error)
  }
}



module.exports = {
  insertFollow,
  checkFollowStatus,
  updateFollowStatus,
  getAccountsFollowing,
  getAccountFollowers,
}
