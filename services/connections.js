const { getAccountDetails, getAccountIdFromEmail, getAccountInfo } = require('../models/accounts')
const { fetchAccountDetailsBasic } = require('../services/accounts')
const {
  insertConnection,
  removeConnection,
  insertConnectionEmailOutreach,
  getAccountConnections,
  getConnectionsToAccount,
  checkConnection,
  getAccountConnectionsEmailOutreach,
  getConnectionsEmailOutreachToAccount,
} = require('../models/connections')
const { sendEmail } = require('../sendgrid')

async function createConnection(info){
    try {
      // TO DO: Send connection email
      const accountId = (info.accountId) ? info.accountId : null
      const connectionAccountId = (info.connectionAccountId) ? info.connectionAccountId : null
      const email = (info.connectionEmail) ? info.connectionEmail : null
      // Check if info contains either connectionAccountId or email
      if (!(Boolean(connectionAccountId) || Boolean(email))) {
        throw new Error('Need either valid connection accountId or email')
      }
      // Check if info contains accountId
      if (!Boolean(accountId)) {
        throw new Error('Need valid accountId')
      }
      const accountDetails = await fetchAccountDetailsBasic(accountId)
      if (connectionAccountId) {
        const connection = await insertConnection({
          'accountId':accountId,
          'connectionAccountId':connectionAccountId,
        })
        const existingConnection = await checkConnection({
          'accountId':connectionAccountId,
          'connectionAccountId':accountId,
        })
        const state = (existingConnection) ? 'connected' : 'pending'
        const connectionAccountDetails = await fetchAccountDetailsBasic(connectionAccountId)
        // Send Email
        const outgoingEmail = (connectionAccountDetails) ? connectionAccountDetails.email : email
        const msg = {
            to: outgoingEmail,
            from: 'abovethecloudsapp@gmail.com',
        }
        if (state=='pending'){
          msg['subject'] = `${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) sent you a connection request`
          msg['text'] = `${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) sent you a request to connect on Above the Clouds (link below):`
        } else {
          msg['subject'] = `You and ${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) are now connected!`
          msg['text'] = `${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) are now connected on Above the Clouds. Enjoy happy times together!`
        }
        sendEmail(msg)
        // Return payload
        return {
          'connectionId': connection.id,
          'accountId': connection.accountId,
          'connectionAccountId': connection.connectionAccountId,
          'connectionUsername': connectionAccountDetails.username,
          'connectionFirstname': connectionAccountDetails.firstname,
          'connectionLastnameInitial': connectionAccountDetails.lastnameInitial,
          'connectionEmail': connectionAccountDetails.email,
          'state': state,
          'createdAt': connection.createdAt,
        }
      } else if (email) {
        const connection = await insertConnectionEmailOutreach({
          'accountId':accountId,
          'connectionEmail':email,
        })
        // Send Email
        msg['subject'] = `${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) invited you to connect on Above the Clouds`
        msg['text'] = `${accountDetails.firstname} ${accountDetails.lastnameInitial} (${accountDetails.username}/${accountDetails.email}) sent you a request to connect on Above the Clouds (link below):`
        sendEmail(msg)
        // Return payload
        return {
          'emailConnectionOutreachId':connection.id,
          'accountId':connection.accountId,
          'connectionEmail':connection.connectionEmail,
          'createdAt':connection.createdAt,
        }
      } else {
        throw new Error('Failed: Unable to make connection request')
      }
    } catch (error) {
      throw new Error(error)
    }
}

async function getConnections(accountId){
  try {
    const results = {}
    // Get Account Email
    const accountDetails = await getAccountDetails(accountId)
    const accountEmail = accountDetails.email
    // Get Account Connections & reformat list of objects to dict
    const accountConnections = await getAccountConnections(accountId)
    const accountConnectionsDict = Object.assign({}, ...accountConnections.map((x) => ({[x.connectionAccountId]: x.createdAt})))
    // Get Connections to Account & reformat list of objects to dict
    const connectionsToAccount = await getConnectionsToAccount(accountId)
    const connectionsToAccountDict = Object.assign({}, ...connectionsToAccount.map((x) => ({[x.accountId]: x.createdAt})))
    // Get all account connections
    const connections = accountConnections.filter(function(item){
      if (connectionsToAccountDict[item.connectionAccountId]) { return item }
    })
    const connectionsFrmtd = await Promise.all(connections.map(async (item) => formatConnectObject(item, connectionsToAccountDict, 'connectionAccountId')))
    const connectionsSrtd = connectionsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all inbound account connection requests
    const inboundConnectionRequests = connectionsToAccount.filter(function(item){
      if (!accountConnectionsDict[item.accountId]) { return item }
    })
    const inboundConnectionRequestsFrmtd = await Promise.all(inboundConnectionRequests.map(async (item) => formatConnectObject(item, accountConnectionsDict, 'accountId')))
    const inboundConnectionRequestsSrtd = inboundConnectionRequestsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all outbound account connection requests
    const outboundConnectionRequests = accountConnections.filter(function(item){
      if (!connectionsToAccountDict[item.connectionAccountId]) { return item }
    })
    const outboundConnectionRequestsFrmtd = await Promise.all(outboundConnectionRequests.map(async (item) => formatConnectObject(item, connectionsToAccountDict, 'connectionAccountId')))
    const outboundConnectionRequestsSrtd = outboundConnectionRequestsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all connections via email outreach
    const emailOutreachConnections = await getAccountConnectionsEmailOutreach(accountId)
    const emailOutreachConnectionsAugmented = await Promise.all(emailOutreachConnections.map(async (item) => {
      return {
        'email':item.connectionEmail,
        'accountId':await getAccountIdFromEmail(item.connectionEmail),
        'ts':item.createdAt.getTime(),
      }
    }))
    const emailOutreachConnectionsFltrd = emailOutreachConnectionsAugmented.filter(function(item){
      if (!item.accountId) { return item }
    })
    const emailOutreachConnectionsSrtd = emailOutreachConnectionsFltrd.sort(function(a,b) {return b.ts - a.ts})
    return {
      'connections':connectionsSrtd,
      'inboundRequests':inboundConnectionRequestsSrtd,
      'outboundRequests':{
          'in-app':outboundConnectionRequestsSrtd,
          'email':emailOutreachConnectionsSrtd,
      }
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function formatConnectObject(x, dict, accountCol){
  try {
    const ts = (dict[x[accountCol]]) ? Math.max(x.createdAt.getTime(), dict[x[accountCol]].getTime()) : x.createdAt.getTime()
    const accountDetailsBasic = await fetchAccountDetailsBasic(x[accountCol])
    accountDetailsBasic['ts'] = ts
    return accountDetailsBasic
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  getConnections,
  createConnection,
}
