const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')
const {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
  getAccountInfo,
  getAccountIdFromEmail,
} = require('../models/accounts')
const { insertTopic } = require('../models/topics')
const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamEmailOutreach,
  getStreamInvitationsFromEmailOutreach,
  insertStreamParticipant,
  getStreamParticipants,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')
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

const testUsername = 'testAccount'

async function getAccountRow(){
  const query = `SELECT id from accounts where username = '${testUsername}'`
  return pool
          .query(query)
          .then(res => res.rows[0])
          .catch(e => e.stack)
}

async function getTopicRow(){
  return pool
          .query(`SELECT id from topics`)
          .then(res => res.rows[0])
          .catch(e => e.stack)
}

describe('DB Migrations Tests', function() {
  it(`Should...
    - Run DB Migrations`, async function() {
      await pgMigrate()
    })
})

describe('Accounts Tests', function() {
  it(`Should...
      - Insert test Account
      - Check to make sure Account info was inserted correctly
      - Insert test Account Details
      - Check to make sure Account Details were inserted correctly
      - Fetch Account Details
      - Check to make sure Account Details were fetched correctly
      - Fetch Username from Account
      - Check to make sure Username from Account was fetched correctly
      - Fetch Account Id from Email
      - Check to make sure Account Id from Email was fetched correctly`, async function() {
    // Insert test Account
    const accountInfo = {
      username:testUsername,
      password:'testPassword',
    }
    await pgTransaction(`DELETE FROM accounts WHERE username = '${accountInfo.username}'`)
    const account = await insertAccount(accountInfo)
    // Check to make sure Account info was inserted correctly
    expect(account.username).to.equal(accountInfo.username)
    should.exist(account.password)
    // Insert test Account Details
    const accountDetailsInfo = {
      accountId: account.id,
      email: 'test@email.com',
      phone:1234567890,
      firstname:'Test',
      lastname:'Account',
    }
    const accountDetails = await insertAccountDetails(accountDetailsInfo)
    // Check to make sure Account Details were inserted correctly
    expect(accountDetails.accountId).to.equal(accountDetailsInfo.accountId)
    expect(accountDetails.email).to.equal(accountDetailsInfo.email)
    expect(Number(accountDetails.phone)).to.equal(accountDetailsInfo.phone)
    expect(accountDetails.firstname).to.equal(accountDetailsInfo.firstname)
    expect(accountDetails.lastname).to.equal(accountDetailsInfo.lastname)
    // Fetch Account Details
    const accountDetailsFetched = await getAccountDetails(account.id)
    // Check to make sure Fetched Account Details are correct
    expect(accountDetailsFetched.accountId).to.equal(accountDetailsInfo.accountId)
    expect(accountDetailsFetched.email).to.equal(accountDetailsInfo.email)
    expect(Number(accountDetailsFetched.phone)).to.equal(accountDetailsInfo.phone)
    expect(accountDetailsFetched.firstname).to.equal(accountDetailsInfo.firstname)
    expect(accountDetailsFetched.lastname).to.equal(accountDetailsInfo.lastname)
    // Fetch Username from Account
    const username = await getAccountInfo(account.id)
    // Check to make sure Username from Account was fetched correctly
    expect(username.username).to.equal(accountInfo.username)
    // Fetch Account Id from Email
    const acccountIdFromEmail = await getAccountIdFromEmail(accountDetailsInfo.email)
    // Check to make sure Account Id from Email was fetched correctly
    expect(acccountIdFromEmail.accountId).to.equal(account.id)
  })
})

describe('Topics Tests', function() {
  it(`Should...
      - Insert test Topic
      - Check to make sure Topic info is correct`, async function() {
    // Insert test topic
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    const topicInfo = {
      accountId:accountId,
      topic:"What's the topic de jour?",
    }
    const topic = await insertTopic(topicInfo)
    // Check to make sure Topic info is correct
    expect(topic.accountId).to.equal(topicInfo.accountId)
    expect(topic.topic).to.equal(topicInfo.topic)
  })
})

describe('Streams Tests', function() {
  it(`Should...
      - Insert Stream
      - Check to make sure Stream info was inserted correctly
      - Fetch Stream Info
      - Check to make sure Stream info was fetched correctly
      - Insert Stream Invite
      - Check to make sure Stream Invite was inserted correctly
      - Fetch Stream Invitiations
      - Check to make sure Stream Invitations were fetched correctly
      - Insert Stream Email Outreach
      - Check to make sure Stream Email Outreach was inserted correctly
      - Fetch Streams from Email Outreach
      - Check to make sure Streams from Email Outreach were fetched correctly
      - Insert Stream Participant
      - Check to make sure Stream Participant was inserted correctly
      - Fetch Stream Participants
      - Check to make sure Stream Participants were fetched correctly
      - Update Stream Participant End Time
      - Check to make sure Stream Participant End Time was updated correctly
      - Update Stream End Time
      - Check to make sure Stream End Time was updated correctly`, async function() {
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    const topic = await getTopicRow()
    const topicId = topic.id
    // Insert Stream
    const streamInfo = {
      topicId: topicId,
      accountId: accountId,
      speakerAccessibility:'invite-only',
      capacity:5,
    }
    const streamStart = new Date(new Date().getTime())
    const stream = await insertStream(streamInfo)
    // Check to make sure Stream info was inserted correctly
    expect(stream.topicId).to.equal(streamInfo.topicId)
    expect(stream.creatorId).to.equal(streamInfo.accountId)
    expect(stream.speakerAccessibility).to.equal(streamInfo.speakerAccessibility)
    expect(stream.capacity).to.equal(streamInfo.capacity)
    expect(stream.startTime.getTime() - streamStart.getTime()).to.be.within(0,1)
    should.not.exist(stream.endTime)
    // Fetch Stream Info
    const fetchedStream = await getStreamDetails(stream.id)
    // Check to make sure Stream info was fetched correctly
    expect(stream.id).to.equal(fetchedStream.id)
    expect(stream.topicId).to.equal(fetchedStream.topicId)
    expect(stream.creatorId).to.equal(fetchedStream.creatorId)
    expect(stream.speakerAccessibility).to.equal(fetchedStream.speakerAccessibility)
    expect(stream.capacity).to.equal(fetchedStream.capacity)
    expect(stream.startTime.getTime()).to.equal(fetchedStream.startTime.getTime())
    should.not.exist(fetchedStream.endTime)
    // Insert Stream Invite
    const streamInviteInfo = {
      streamId:stream.id,
      accountId:accountId,
      inviteeAccountId:accountId,
    }
    const streamInvite = await insertStreamInvitation(streamInviteInfo)
    // Check to make sure Stream Invite was inserted correctly
    expect(streamInvite.streamId).to.equal(streamInviteInfo.streamId)
    expect(streamInvite.accountId).to.equal(streamInviteInfo.accountId)
    expect(streamInvite.inviteeAccountId).to.equal(streamInviteInfo.inviteeAccountId)
    // Fetch Stream Invitiations
    const invitations = await getStreamInvitations(stream.id)
    // Check to make sure Stream Invitations were fetched correctly
    expect(invitations.length).to.equal(1)
    expect(invitations[0].id).to.equal(streamInvite.id)
    expect(invitations[0].streamId).to.equal(streamInvite.streamId)
    expect(invitations[0].accountId).to.equal(streamInvite.accountId)
    expect(invitations[0].inviteeAccountId).to.equal(streamInvite.inviteeAccountId)
    // Insert Stream Email Outreach
    const streamEmailOutreachInfo = {
      streamId:stream.id,
      accountId:accountId,
      inviteeEmail:'test2@email.com',
    }
    const streamEmailOutreach = await insertStreamEmailOutreach(streamEmailOutreachInfo)
    // Check to make sure Stream Email Outreach was inserted correctly
    expect(streamEmailOutreach.streamId).to.equal(streamEmailOutreachInfo.streamId)
    expect(streamEmailOutreach.accountId).to.equal(streamEmailOutreachInfo.accountId)
    expect(streamEmailOutreach.inviteeEmail).to.equal(streamEmailOutreachInfo.inviteeEmail)
    // Fetch Streams from Email Outreach
    const streamInvitationsFromEmailOutreach = await getStreamInvitationsFromEmailOutreach(streamEmailOutreachInfo.inviteeEmail)
    // Check to make sure Streams from Email Outreach were fetched correctly
    expect(streamInvitationsFromEmailOutreach[0].id).to.equal(streamEmailOutreach.id)
    expect(streamInvitationsFromEmailOutreach[0].streamId).to.equal(streamEmailOutreach.streamId)
    expect(streamInvitationsFromEmailOutreach[0].accountId).to.equal(streamEmailOutreach.accountId)
    expect(streamInvitationsFromEmailOutreach[0].inviteeEmail).to.equal(streamEmailOutreach.inviteeEmail)
    // Insert Stream Participant
    const streamParticipantInfo = {
      streamId:stream.id,
      accountId:accountId,
    }
    const streamParticipantStart = new Date(new Date().getTime())
    const streamParticipant = await insertStreamParticipant(streamParticipantInfo)
    // Check to make sure Stream Participant was inserted correctly
    expect(streamParticipant.streamId).to.equal(streamParticipantInfo.streamId)
    expect(streamParticipant.accountId).to.equal(streamParticipantInfo.accountId)
    expect(streamParticipant.startTime.getTime() - streamParticipantStart.getTime()).to.be.within(0,1)
    should.not.exist(streamParticipant.endTime)
    // Fetch Stream Participants
    const participants = await getStreamParticipants(stream.id)
    // Check to make sure Stream Participants were fetched correctly
    expect(participants.length).to.equal(1)
    expect(participants[0].id).to.equal(streamParticipant.id)
    expect(participants[0].streamId).to.equal(streamParticipant.streamId)
    expect(participants[0].accountId).to.equal(streamParticipant.accountId)
    expect(participants[0].startTime.getTime()).to.equal(streamParticipant.startTime.getTime())
    should.not.exist(participants[0].endTime)
    // Update Stream Participant End Time
    const streamParticipantEndBenchmark = new Date(new Date().getTime())
    const streamParticipantEnd = await updateStreamParticipantEndTime(streamParticipant.id)
    // Check to make sure Stream Participant End Time was updated correctly
    expect(streamParticipantEnd.id).to.equal(streamParticipant.id)
    expect(streamParticipantEnd.endTime.getTime() - streamParticipantEndBenchmark.getTime()).to.be.within(0,1)
    // Update Stream End Time
    const streamEndBenchmark = new Date(new Date().getTime())
    const streamEnd = await updateStreamEndTime(stream.id)
    // Check to make sure Stream End Time was updated correctly
    expect(streamEnd.id).to.equal(stream.id)
    expect(streamEnd.endTime.getTime() - streamEndBenchmark.getTime()).to.be.within(0,1)
  })
})

describe('Connections Tests', function() {
  it(`Should...
      - Get original AccountId
      - Insert new test Account
      - Insert Connection
      - Check to make sure Connection was inserted correctly
      - Fetch Account Connection
      - Check to make sure Account Connection was fetched correctly
      - Fetch all Account Connections
      - Check to make sure Account Connections were fetched correctly
      - Fetch Connections to Account
      - Check to make sure Connections to Account were fetched correctly
      - Insert Connection Email Outreach
      - Check to make sure Connection Email Outreach was inserted correctly
      - Fetch Account Connections Email Outreach
      - Check to make sure Account Connections Email Outreach were fetched correctly
      - Fetch Connections Email Outreach to Account
      - Check to make sure Connections Email Outreach to Account were fetched correctly
      - Remove Connection
      - Check to make sure Connection was removed correctly`, async function() {
    // Get original AccountId
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    // Insert new test Account
    const testConnectionsUsername = 'testAccountConnections'
    await pgTransaction(`DELETE FROM accounts WHERE username = '${testConnectionsUsername}'`)
    const connectionAccountInfo = {
      username:testConnectionsUsername,
      password:'testConnectionsPassword',
    }
    const connectionAccount = await insertAccount(connectionAccountInfo)
    const connectionAccountId = connectionAccount.id
    const connectionAccountDetailsInfo = {
      accountId: connectionAccountId,
      email: 'testconnections@email.com',
      phone:2345678901,
      firstname:'Test',
      lastname:'Connections',
    }
    const connectionAccountDetails = await insertAccountDetails(connectionAccountDetailsInfo)
    // Insert Connection
    const connectionInfo = {
      accountId:accountId,
      connectionId:connectionAccountId,
    }
    const connection = await insertConnection(connectionInfo)
    // Check to make sure Connection was inserted correctly
    expect(connection.accountId).to.equal(connectionInfo.accountId)
    expect(connection.connectionId).to.equal(connectionInfo.connectionId)
    // Fetch Account Connection
    const connectionCheck1 = await checkConnection(connectionInfo)
    const connectionCheck2 = await checkConnection({accountId:connectionAccountId,connectionId:accountId})
    // Check to make sure Account Connection was fetched correctly
    expect(connectionCheck1.accountId).to.equal(connectionInfo.accountId)
    expect(connectionCheck1.connectionId).to.equal(connectionInfo.connectionId)
    should.not.exist(connectionCheck2)
    // Fetch all Account Connections
    const accountConnectionsArrayNonEmpty = await getAccountConnections(accountId)
    const accountConnectionsArrayEmpty = await getAccountConnections(connectionAccountId)
    // Check to make sure Account Connections were fetched correctly
    expect(accountConnectionsArrayNonEmpty[0].connectionId).to.equal(connectionAccountId)
    should.not.exist(accountConnectionsArrayEmpty[0])
    // Fetch Connections to Account
    const connectionsToAccountArrayEmpty = await getConnectionsToAccount(accountId)
    const connectionsToAccountArrayNonEmpty = await getConnectionsToAccount(connectionAccountId)
    // Check to make sure Connections to Account were fetched correctly
    should.not.exist(connectionsToAccountArrayEmpty[0])
    expect(connectionsToAccountArrayNonEmpty[0].accountId).to.equal(accountId)
    // Insert Connection Email Outreach
    const connectionEmailOutreachInfo = {
      accountId:accountId,
      connectionEmail:'connection@test.com',
    }
    const connectionEmailOutreach = await insertConnectionEmailOutreach(connectionEmailOutreachInfo)
    // Check to make sure Connection Email Outreach was inserted correctly
    expect(connectionEmailOutreach.accountId).to.equal(connectionEmailOutreachInfo.accountId)
    expect(connectionEmailOutreach.connectionEmail).to.equal(connectionEmailOutreachInfo.connectionEmail)
    // Fetch Account Connections Email Outreach
    const accountConnectionsEmailOutreachNonEmpty = await getAccountConnectionsEmailOutreach(accountId)
    const accountConnectionsEmailOutreachEmpty = await getAccountConnectionsEmailOutreach(connectionAccountId)
    // Check to make sure Account Connections Email Outreach were fetched correctly
    expect(accountConnectionsEmailOutreachNonEmpty[0].connectionEmail).to.equal(connectionEmailOutreachInfo.connectionEmail)
    should.not.exist(accountConnectionsEmailOutreachEmpty[0])
    // Fetch Connections Email Outreach to Account
    const connectionsEmailOutreachToAccountNonEmpty = await getConnectionsEmailOutreachToAccount(connectionEmailOutreachInfo.connectionEmail)
    const connectionsEmailOutreachToAccountEmpty = await getConnectionsEmailOutreachToAccount(connectionAccountDetailsInfo.email)
    // Check to make sure Connections Email Outreach to Account were fetched correctly
    expect(connectionsEmailOutreachToAccountNonEmpty[0].accountId).to.equal(accountId)
    should.not.exist(connectionsEmailOutreachToAccountEmpty[0])
    // Remove Connection
    await removeConnection(connectionInfo)
    // Check to make sure Connection was removed correctly
    const removedConnection = await getAccountConnections(accountId)
    should.not.exist(removedConnection[0])
  })
})
