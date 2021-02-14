const {
  insertFollower,
  checkFollowerStatus,
  updateFollowerStatus,
  getAccountsFollowing,
  getAccountFollowers,
} = require('../models/follows')
const {
  fetchAccountDetails,
} = require('../services/accounts')
const {
  getEmailFromInvitationId,
  getInvitationsToEmail,
  getInvitationIdForConvertedAccount,
} = require('../models/invitations')

async function follow(followInfo){
  try {
    const followCheck = await checkFollowerStatus(followInfo)
    // Check if follower DB entry exists
    if (Boolean(followCheck[0])){
      followInfo['unfollow'] = false
      const follow = updateFollowerStatus(followInfo)
      return
    } else {
      const follow = await insertFollower(followInfo)
      return follow
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function unfollow(unfollowInfo){
  try {
    const unfollowCheck = await checkFollowerStatus(unfollowInfo)
    if (Boolean(unfollowCheck[0])){
      unfollowInfo['unfollow'] = true
      const unfollow = updateFollowerStatus(unfollowInfo)
      return unfollow
    } else {
      return {}
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function getFollowingSuggestions(params){
  try {
    const { accountId } = params
    // Get accounts following
    const accountsFollowingRows = await getAccountsFollowing(accountId)
    const accountsFollowing = accountsFollowingRows.map(account => { return account.accountId })
    // Get email used to register
    const accountDetails = await fetchAccountDetails(accountId)
    const registrationEmail = accountDetails.email
    // Get email invitation was sent to
    const invitationIdRow = await getInvitationIdForConvertedAccount(accountId)
    const invitationId = (invitationIdRow[0]) ? invitationIdRow[0].invitationCodeId : null
    const invitationEmailRow = await getEmailFromInvitationId(invitationId)
    const invitationEmail = (invitationEmailRow[0]) ? invitationEmailRow[0].email : null
    // Get all accountIds for accounts that sent an invite to user
    const emailsFull = [...new Set([registrationEmail, invitationEmail])]
    const emails = emailsFull.filter(x => x !== null)
    const invitationAccountIdsSet = new Set([])
    await Promise.all(emails.map(async (email) => {
      const invitations = await getInvitationsToEmail(email)
      invitations.map(accountIdRow => {
        invitationAccountIdsSet.add(accountIdRow.accountId)
      })
    }))
    // Get "first order account ids" (i.e. accountIds that invited user + following accountIds)
    const firstOrderAccountIdsSet = invitationAccountIdsSet
    accountsFollowing.map(accountId => firstOrderAccountIdsSet.add(accountId))
    const firstOrderAccountIds = [...firstOrderAccountIdsSet]
    // Suggest accounts that are followed by following accounts/accounts that invited user
    const followSuggestionsSet = invitationAccountIdsSet
    await Promise.all(firstOrderAccountIds.map(async (accountId) => {
      const followSuggestionsArray = await getAccountsFollowing(accountId)
      followSuggestionsArray.map(followSuggestionRow => {
        followSuggestionsSet.add(followSuggestionRow.accountId)
      })
    }))
    const followSuggestions = [...followSuggestionsSet]
    // Filter out following accounts from follow suggestions array
    const followSuggestionsFltrd = followSuggestions.filter(accountId => !accountsFollowing.includes(accountId))
    // Get account details for following accounts
    const returnObject = await Promise.all(followSuggestionsFltrd.map(async (accountId) => {
      const followingAccountDetails = await fetchAccountDetails(accountId)
      return {
        accountId: accountId,
        username: followingAccountDetails.username,
        firstname: followingAccountDetails.firstname,
        lastname: followingAccountDetails.lastname,
        profilePicture: followingAccountDetails.profilePicture,
      }
    }))
    return {
      suggestions: returnObject,
    }
  } catch (error) {
    throw new Error(error)
  }
}



module.exports = {
  follow,
  unfollow,
  getFollowingSuggestions,
}
