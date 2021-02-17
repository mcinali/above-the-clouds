const {
  fuzzyMatchAccountsByUsername,
  fuzzyMatchAccountsByEmail,
  fuzzyMatchAccountsByFullName,
} = require('../models/accounts')
const { getAccountsFollowing } = require('../models/follows')
const { fetchAccountDetailsBasic } = require('../services/accounts')

async function getAccountSuggestions(accountId, text){
  const textSplit = text.split(' ')
  const firstname = textSplit[0]
  const lastname = (textSplit.length > 1) ? textSplit[1] : ''
  const usernameOptions = await fuzzyMatchAccountsByUsername(text)
  const emailOptions = await fuzzyMatchAccountsByEmail(text)
  const fullNameOptions = await fuzzyMatchAccountsByFullName(firstname, lastname)
  const optionsAccountIds = [...new Set(usernameOptions.concat(emailOptions).concat(fullNameOptions).map(object => object.accountId))].splice(0,10)
  const followingAccountIdRows = await getAccountsFollowing(accountId)
  const followingAccountIds = followingAccountIdRows.map(item => item.accountId)
  const options = Promise.all(optionsAccountIds.map(async (optionAccountId) => {
    const results = await fetchAccountDetailsBasic(optionAccountId)
    results['following'] = (followingAccountIds.includes(optionAccountId)) ? true : false
    return results
  }))
  return options
}

module.exports = {
  getAccountSuggestions,
}
