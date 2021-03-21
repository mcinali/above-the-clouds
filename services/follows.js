const {
  insertFollow,
  checkFollowStatus,
  updateFollowStatus,
  getAccountsFollowing,
  getAccountFollowers,
} = require('../models/follows')
const {
  fetchAccountDetails,
  fetchAccountDetailsBasic,
} = require('../services/accounts')
const {
  getEmailFromInvitationId,
  getInvitationsToEmail,
  getInvitationIdForConvertedAccount,
} = require('../models/invitations')
const { getActiveAccountSocketConnections } = require('../models/sockets')
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
      const accountDetails = await fetchAccountDetailsBasic(followInfo.accountId)
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
    const invitationAccountIds = [...invitationAccountIdsSet]
    // Get filter list (accounts following + accountId)
    const filterAccountIds = accountsFollowing.concat([parseInt(accountId)])
    // Get "first order account ids" (i.e. accountIds that invited user + following accountIds)
    const firstOrderAccountIds = [...new Set(accountsFollowing.concat(invitationAccountIds))]
    // Suggest accounts that are followed by 1st order accountIds (accounts following + invite accounts)
    const followingSuggestionsDict = {}
    await Promise.all(firstOrderAccountIds.map(async (id) => {
      const followSuggestionsArray = await getAccountsFollowing(id)
      followSuggestionsArray.map(followSuggestionRow => {
        const followingAccountId = followSuggestionRow.accountId
        if (!filterAccountIds.includes(followingAccountId)){
          if (followingSuggestionsDict[followingAccountId]){
            followingSuggestionsDict[followingAccountId] = followingSuggestionsDict[followingAccountId] + 1
          } else {
            followingSuggestionsDict[followingAccountId] = 1
          }
        }
      })
    }))
    // Suggest follower accounts
    accountFollowers.map(id => {
      if (!filterAccountIds.includes(id)){
        if (followingSuggestionsDict[id]){
          followingSuggestionsDict[id] = followingSuggestionsDict[id] + 2
        } else {
          followingSuggestionsDict[id] = 2
        }
      }
    })
    // Convert dict to (sortable) array of objects
    const followingSuggestionObjects = []
    Object.keys(followingSuggestionsDict).forEach(function(key){
      const obj = {
        accountId: key,
        value: followingSuggestionsDict[key],
      }
      followingSuggestionObjects.push(obj)
    })
    // Sort array of objects based on value (aggregate accounts following)
    followingSuggestionObjects.sort(function(a,b){
      return b.value - a.value
    })
    // Get top 10 following suggestions
    const topTenFollowingSuggestions = followingSuggestionObjects.slice(0,10)
    // Get account details for following suggestions
    const returnObject = await Promise.all(topTenFollowingSuggestions.map(async (id) => {
      const followingAccountDetails = await fetchAccountDetailsBasic(id.accountId)
      return followingAccountDetails
    }))
    return {
      suggestions: returnObject,
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function getOnlineAccountsFollowing(accountId){
  try {
    const accountsFollowing = await getAccountsFollowing(accountId)
    const onlineFollowing = await Promise.all(accountsFollowing.map( async (following) => {
      const id = following.accountId
      const socketConnections = await getActiveAccountSocketConnections(id)
      if (Boolean(socketConnections[0])){
        const accountInfo = await fetchAccountDetailsBasic(id)
        return accountInfo
      }
    }))
    return onlineFollowing.filter(entry => entry!=null)
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountsFollowing(accountId){
  try {
    const following = await getAccountsFollowing(accountId)
    const followingFrmtd = await Promise.all(following.map(async (row) => {
      return await fetchAccountDetailsBasic(row.accountId)
    }))
    return followingFrmtd
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchAccountFollowers(accountId){
  try {
    const followers = await getAccountFollowers(accountId)
    const followersFrmtd = await Promise.all(followers.map(async (row) => {
      return await fetchAccountDetailsBasic(row.accountId)
    }))
    return followersFrmtd
  } catch (error) {
    throw new Error(error)
  }
}



module.exports = {
  follow,
  unfollow,
  getFollowingSuggestions,
  getOnlineAccountsFollowing,
  fetchAccountsFollowing,
  fetchAccountFollowers,
}
