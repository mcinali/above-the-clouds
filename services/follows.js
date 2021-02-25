const {
  insertFollow,
  checkFollowStatus,
  updateFollowStatus,
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
const { sendEmail } = require('../sendgrid')
const { webURL } = require('../config')

async function follow(followInfo){
  try {
    const followCheck = await checkFollowStatus(followInfo)
    // Check if follower DB entry exists
    if (Boolean(followCheck[0])){
      followInfo['unfollow'] = false
      const follow = updateFollowStatus(followInfo)
      return
    } else {
      const follow = await insertFollow(followInfo)
      const accountDetails = await fetchAccountDetails(followInfo.accountId)
      const followingAccountDetails = await fetchAccountDetails(followInfo.followingAccountId)
      const msg = {
        from: 'abovethecloudsapp@gmail.com',
        to: followingAccountDetails.email,
        subject: `So popular! ${accountDetails.firstname} ${accountDetails.lastname} (${accountDetails.username}) started following you`,
        text: `${accountDetails.firstname} ${accountDetails.lastname} (${accountDetails.username}) started following you on Above the Clouds.

        Get a conversation going: ${webURL}`,
      }
      sendEmail(msg)
      return follow
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function unfollow(unfollowInfo){
  try {
    const unfollowCheck = await checkFollowStatus(unfollowInfo)
    if (Boolean(unfollowCheck[0])){
      unfollowInfo['unfollow'] = true
      const unfollow = updateFollowStatus(unfollowInfo)
      return unfollow
    } else {
      return {}
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function getFollowingSuggestions(accountId){
  try {
    // Get accounts following
    const accountsFollowingRows = await getAccountsFollowing(accountId)
    const accountsFollowing = accountsFollowingRows.map(account => { return account.accountId })
    // Get account followers
    const accountFollowersRows = await getAccountFollowers(accountId)
    const accountFollowers = accountFollowersRows.map(account => { return account.accountId })
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
    const followSuggestions = [...followSuggestionsSet].concat(accountFollowers)
    // Filter out following accounts from follow suggestions array
    const followSuggestionsFltrd = followSuggestions.filter(accountId => !accountsFollowing.includes(accountId))
    const followSuggestionsFinal = followSuggestionsFltrd.filter(suggestionsAccountId => suggestionsAccountId!=accountId)
    // Get account details for following accounts
    const returnObject = await Promise.all(followSuggestionsFinal.map(async (accountId) => {
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
