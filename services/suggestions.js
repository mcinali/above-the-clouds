const {
  fuzzyMatchAccountsByUsername,
  fuzzyMatchAccountsByEmail,
  fuzzyMatchAccountsByFullName,
} = require('../models/accounts')
const {
  getAccountsFollowing,
  getAccountFollowers,
} = require('../models/follows')
const { fetchAccountDetailsBasic } = require('../services/accounts')

async function getAccountSuggestions(accountId, text){
  // Parse first & last name
  const textSplit = text.split(' ')
  const firstname = textSplit[0]
  const lastname = (textSplit.length > 1) ? textSplit[1] : ''
  // Fuzzy match across different attributes to return options
  const usernameOptions = await fuzzyMatchAccountsByUsername(text)
  const emailOptions = await fuzzyMatchAccountsByEmail(text)
  const fullNameOptions = await fuzzyMatchAccountsByFullName(firstname, lastname)
  // Get option Ids
  const optionsAccountIds = usernameOptions.concat(emailOptions).concat(fullNameOptions).map(object => object.accountId)
  // Filter down to only followers & accounts following
  const followerRows = await getAccountFollowers(accountId)
  const followerAccountIds = followerRows.map(item => item.accountId)
  const followingAccountIdRows = await getAccountsFollowing(accountId)
  const followingAccountIds = followingAccountIdRows.map(item => item.accountId)
  const combinedAccountsIds = followerAccountIds.concat(followingAccountIds)
  const optionsAccountIdsFltrd = optionsAccountIds.filter(id => combinedAccountsIds.includes(id))
  // Get only unique account Ids
  const optionsAccountIdsUnique = [...new Set(optionsAccountIdsFltrd)]
  // Format results
  const options = Promise.all(optionsAccountIdsUnique.map(async (optionAccountId) => {
    const results = await fetchAccountDetailsBasic(optionAccountId)
    results['following'] = (followingAccountIds.includes(optionAccountId)) ? true : false
    return results
  }))
  return options
}

module.exports = {
  getAccountSuggestions,
}
