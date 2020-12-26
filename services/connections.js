const { getAccountDetails, getAccountUsername, getAccountFromEmail } = require('../models/accounts')
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


async function createConnection(info){
    try {
      const accountId = info.accountId
      const email = (info.connectionEmail) ? info.connectionEmail : null
      const connectionIdRow = await getAccountFromEmail(email)
      const connectionId = (connectionIdRow) ? connectionIdRow.account_id : info.connectionId
      if (connectionId) {
        const connection = await insertConnection({
          'accountId':accountId,
          'connectionId':connectionId,
        })
        const existingConnection = await checkConnection({
          'accountId':connectionId,
          'connectionId':accountId,
        })
        connection['state'] = (existingConnection) ? 'connected' : 'pending'
        return connection
        // TO DO: Send email
      } else if (email) {
        const connection = await insertConnectionEmailOutreach({
          'accountId':accountId,
          'connectionEmail':email,
        })
        return connection
      } else {
        return 'Failed: Connection AccountId and Email Missing from Request'
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
    const accountConnectionsDict = Object.assign({}, ...accountConnections.map((x) => ({[x.connection_id]: x.created_at})))
    // Get Connections to Account & reformat list of objects to dict
    const connectionsToAccount = await getConnectionsToAccount(accountId)
    const connectionsToAccountDict = Object.assign({}, ...connectionsToAccount.map((x) => ({[x.account_id]: x.created_at})))
    // Get all account connections
    const connections = accountConnections.filter(function(item){
      if (connectionsToAccountDict[item.connection_id]) { return item }
    })
    const connectionsFrmtd = await Promise.all(connections.map(async (item) => formatConnectObject(item, connectionsToAccountDict, 'connection_id')))
    const connectionsSrtd = connectionsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all inbound account connection requests
    const inboundConnectionRequests = connectionsToAccount.filter(function(item){
      if (!accountConnectionsDict[item.account_id]) { return item }
    })
    const inboundConnectionRequestsFrmtd = await Promise.all(inboundConnectionRequests.map(async (item) => formatConnectObject(item, accountConnectionsDict, 'account_id')))
    const inboundConnectionRequestsSrtd = inboundConnectionRequestsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all outbound account connection requests
    const outboundConnectionRequests = accountConnections.filter(function(item){
      if (!connectionsToAccountDict[item.connection_id]) { return item }
    })
    const outboundConnectionRequestsFrmtd = await Promise.all(outboundConnectionRequests.map(async (item) => formatConnectObject(item, connectionsToAccountDict, 'connection_id')))
    const outboundConnectionRequestsSrtd = outboundConnectionRequestsFrmtd.sort(function(a,b) {return b.ts - a.ts})
    // Get all connections via email outreach
    const emailOutreachConnections = await getAccountConnectionsEmailOutreach(accountId)
    const emailOutreachConnectionsAugmented = await Promise.all(emailOutreachConnections.map(async (item) => {
      return {
        'email':item.connection_email,
        'accountId':await getAccountFromEmail(item.connection_email),
        'ts':item.created_at.getTime(),
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
    const ts = (dict[x[accountCol]]) ? Math.max(x.created_at.getTime(), dict[x[accountCol]].getTime()) : x.created_at.getTime()
    const connectionUsername = await getAccountUsername(x[accountCol])
    const connectionDetails = await getAccountDetails(x[accountCol])
    return {
      'accountId':x[accountCol],
      'username':connectionUsername.username,
      'email':connectionDetails.email,
      'ts':ts
    }
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  getConnections,
  createConnection,
}
