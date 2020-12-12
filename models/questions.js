const { pgTransaction } = require('../pg_helpers')

async function storeQuestion(info){
  try {
    const { accountId, question } = info
    const query = `
      INSERT INTO questions (account_id, question)
      VALUES (${accountId}, '${question}')
      RETURNING *`
    console.log(query)
    const result = await pgTransaction(query)
    return result.rows[0]
  } catch (error) {
    console.error(error.stack)
    throw new Error(error)
  }
}

module.exports = {
  storeQuestion,
}
