const { webURL } = require('../config')
const { sendEmail } = require('../sendgrid')
const { sendSMS } = require('../twilio')
const {
  insertOnlineBroadcast,
  getRecentOnlineBroadcasts,
} = require('../models/broadcasts')
const { getAccountFollowers } = require('../models/follows')
const { fetchAccountDetailsBasic } = require('../services/accounts')
const { getAccountDetails } = require('../models/accounts')

async function onlineBroadcast(broadcastInfo){
  try {
    // Parse broadcastInfo
    const { accountId, broadcastAccountIds } =  broadcastInfo
    // Determine if we're broadcasting to all followers or just select followers
    const followerAccounts = await getAccountFollowers(accountId)
    const followerAccountIds = followerAccounts.map(row => row.accountId)
    const broadcastAccountIdsResolved = (broadcastAccountIds.length==0) ? followerAccountIds : broadcastAccountIds
    // Make sure we're only broadcasting to account followers
    const broadcastAccountIdsFull = broadcastAccountIdsResolved.filter(id => followerAccountIds.includes(id))
    // Filter out accounts broadcasted to in the past 24 hrs
    const broadcastLookupInfo = {
      accountId: accountId,
      lookbackHours: 24,
    }
    const recentOnlineBroadcasts = await getRecentOnlineBroadcasts(broadcastLookupInfo)
    const recentOnlineBroadcastAccountIds = recentOnlineBroadcasts.map(row => row.broadcastAccountId)
    const broadcastAccountIdsFltrd = broadcastAccountIdsFull.filter(id => !recentOnlineBroadcastAccountIds.includes(id))
    // Prepare message text
    const accountInfo = await fetchAccountDetailsBasic(accountId)
    const textMessage = `${accountInfo.firstname} ${accountInfo.lastname} (${accountInfo.username}) wants you to join them on Above the Clouds: ${webURL}
    `
    // Broadcast text to each account
    broadcastAccountIdsFltrd.map(async (id) => {
      const accountDetails = await getAccountDetails(id)
      const phoneNumber = accountDetails.phone
      sendSMS(phoneNumber, textMessage)
      const broadcastInfo = {
        accountId: accountId,
        broadcastAccountId: id,
      }
      insertOnlineBroadcast(broadcastInfo)
    })
    return broadcastAccountIdsFltrd
  } catch (error) {
    throw new Error(error)
  }
}

async function fetchRecentOnlineBroadcasts(accountId){
  try {
    const broadcastLookupInfo = {
      accountId: accountId,
      lookbackHours: 24,
    }
    return getRecentOnlineBroadcasts(broadcastLookupInfo)
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  onlineBroadcast,
  fetchRecentOnlineBroadcasts,
}
