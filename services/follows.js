const {
  insertFollower,
  checkFollowerStatus,
  updateFollowerStatus,
  getAccountFollowing,
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

async function getFollowingSuggestionsAccountSetup(params){
  try {
    const { accountId } = params
    // Get email used to register
    const accountDetails = await fetchAccountDetails(accountId)
    const accountEmail = accountDetails.email
    // Get invitation email
    const invitationIdRow = await getInvitationIdForConvertedAccount(accountId)
    const invitationId = (invitationIdRow[0]) ? invitationIdRow[0].invitationCodeId : null
    const invitationEmailRow = await getEmailFromInvitationId(invitationId)
    const invitationEmail = (invitationEmailRow[0]) ? invitationEmailRow[0].email : null
    // Get all account Ids for accounts that sent an invite to new user
    const emailsFull = [...new Set([accountEmail, invitationEmail, null])]
    const emails = emailsFull.filter(x => x !== null)
    const invitationAccountIdsSet = new Set([])
    await Promise.all(emails.map(async (email) => {
      const invitations = await getInvitationsToEmail(email)
      invitations.map(accountIdRow => {
        invitationAccountIdsSet.add(accountIdRow.accountId)
      })
    }))
    const invitationAccountIds = [...invitationAccountIdsSet]
    // Get Following for accounts
    const followingSet = new Set(invitationAccountIds)
    await Promise.all(invitationAccountIds.map(async (accountId) => {
      const followingArray = await getAccountFollowing(accountId)
      followingArray.map(followingRow => {
        followingSet.add(followingRow.accountId)
      })
    }))
    const following = [...followingSet]
    // Get account details for following accounts
    const returnObject = await Promise.all(following.map(async (accountId) => {
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
  getFollowingSuggestionsAccountSetup,
}
