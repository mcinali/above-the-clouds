const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')
const {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
} = require('../models/accounts')
const { insertTopic } = require('../models/topics')
const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamParticipant,
  getStreamParticipants,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')

const testUsername = 'testAccount'

async function getAccountRow(){
  return pool
          .query(`SELECT id from accounts where username = '${testUsername}'`)
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
      - Check to make sure Account info is correct
      - Insert test Account Details
      - Check to make sure Account details are correct
      - Get Account Details
      - Check to make sure Fetched Account Details are correct`, async function() {
    // Insert test Account
    const accountInfo = {
      username:testUsername,
      password:'testPassword',
    }
    await pgTransaction(`DELETE FROM accounts WHERE username = '${accountInfo.username}'`)
    const account = await insertAccount(accountInfo)
    // Check to make sure Account info is correct
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
    await pgTransaction(`DELETE FROM account_details WHERE account_id = ${accountDetailsInfo.accountId}`)
    const accountDetails = await insertAccountDetails(accountDetailsInfo)
    // Check to make sure Account details are correct
    expect(accountDetails.account_id).to.equal(accountDetailsInfo.accountId)
    expect(accountDetails.email).to.equal(accountDetailsInfo.email)
    expect(Number(accountDetails.phone)).to.equal(accountDetailsInfo.phone)
    expect(accountDetails.firstname).to.equal(accountDetailsInfo.firstname)
    expect(accountDetails.lastname).to.equal(accountDetailsInfo.lastname)
    // Get Account Details
    const accountDetailsFetched = await getAccountDetails(account.id)
    // Check to make sure Fetched Account Details are correct
    expect(accountDetailsFetched.account_id).to.equal(accountDetailsInfo.accountId)
    expect(accountDetailsFetched.email).to.equal(accountDetailsInfo.email)
    expect(Number(accountDetailsFetched.phone)).to.equal(accountDetailsInfo.phone)
    expect(accountDetailsFetched.firstname).to.equal(accountDetailsInfo.firstname)
    expect(accountDetailsFetched.lastname).to.equal(accountDetailsInfo.lastname)

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
    expect(topic.account_id).to.equal(topicInfo.accountId)
    expect(topic.topic).to.equal(topicInfo.topic)
  })
})

describe('Streams Tests', function() {
  it(`Should...
      - Insert Stream
      - Check to make sure Stream info was inserted correctly
      - Fetch Stream Info
      - Check to make sure Stream info was fetched correctly
      - Insert Stream Email Invite
      - Check to make sure Stream Email Invite was inserted correctly
      - Insert Stream Account Invite
      - Check to make sure Stream Account Invite was inserted correctly
      - Fetch Stream Invitiations
      - Check to make sure Stream Invitations were fetched correctly
      - Insert Stream Participant
      - Check to make sure Stream Participant was inserted correctly
      - Fetch Stream Participants
      - Check to make sure Stream Participants were fetched correctly
      - Update Stream Participant End Time
      - Check to make sure Stream Participant End Time was updated correctly
      - Update Stream End Time
      - Check to make sure Stream End Time was updated correctly`, async function() {
    // Insert Stream
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    const topic = await getTopicRow()
    const topicId = topic.id
    const streamInfo = {
      topicId: topicId,
      accountId: accountId,
      speakerAccessibility:'invite-only',
      capacity:5,
    }
    const streamStart = new Date(new Date().getTime())
    const stream = await insertStream(streamInfo)
    // Check to make sure Stream info was inserted correctly
    expect(stream.topic_id).to.equal(streamInfo.topicId)
    expect(stream.creator_id).to.equal(streamInfo.accountId)
    expect(stream.speaker_accessibility).to.equal(streamInfo.speakerAccessibility)
    expect(stream.capacity).to.equal(streamInfo.capacity)
    expect(stream.start_time.getTime() - streamStart.getTime()).to.be.within(0,1)
    should.not.exist(stream.end_time)
    // Fetch Stream Info
    const fetchedStream = await getStreamDetails(stream.id)
    // Check to make sure Stream info was fetched correctly
    expect(stream.id).to.equal(fetchedStream.id)
    expect(stream.topic_id).to.equal(fetchedStream.topic_id)
    expect(stream.creator_id).to.equal(fetchedStream.creator_id)
    expect(stream.speaker_accessibility).to.equal(fetchedStream.speaker_accessibility)
    expect(stream.capacity).to.equal(fetchedStream.capacity)
    expect(stream.start_time.getTime()).to.equal(fetchedStream.start_time.getTime())
    should.not.exist(fetchedStream.end_time)
    // Insert Stream Email Invite
    const emailInviteInfo = {
      streamId:stream.id,
      accountId:accountId,
      inviteeEmail:'test2@email.com',
    }
    const emailInvite = await insertStreamInvitation(emailInviteInfo)
    // Check to make sure Stream Email Invite was inserted correctly
    expect(emailInvite.stream_id).to.equal(emailInviteInfo.streamId)
    expect(emailInvite.account_id).to.equal(emailInviteInfo.accountId)
    expect(emailInvite.invitee_email).to.equal(emailInviteInfo.inviteeEmail)
    should.not.exist(emailInvite.invitee_account_id)
    // Insert Stream Account Invite
    const accountInviteInfo = {
      streamId:stream.id,
      accountId:accountId,
      inviteeAccountId:accountId,
    }
    const accountInvite = await insertStreamInvitation(accountInviteInfo)
    // Check to make sure Stream Account Invite was inserted correctly
    expect(accountInvite.stream_id).to.equal(accountInviteInfo.streamId)
    expect(accountInvite.account_id).to.equal(accountInviteInfo.accountId)
    expect(accountInvite.invitee_account_id).to.equal(accountInviteInfo.inviteeAccountId)
    should.not.exist(accountInvite.invitee_email)
    // Fetch Stream Invitiations
    const invitations = await getStreamInvitations(stream.id)
    // Check to make sure Stream Invitations were fetched correctly
    expect(invitations.length).to.equal(2)
    expect(invitations[0].id).to.equal(emailInvite.id)
    expect(invitations[0].stream_id).to.equal(emailInvite.stream_id)
    expect(invitations[0].account_id).to.equal(emailInvite.account_id)
    should.not.exist(invitations[0].invitee_account_id)
    expect(invitations[0].invitee_email).to.equal(emailInvite.invitee_email)
    expect(invitations[1].id).to.equal(accountInvite.id)
    expect(invitations[1].stream_id).to.equal(accountInvite.stream_id)
    expect(invitations[1].account_id).to.equal(accountInvite.account_id)
    expect(invitations[1].invitee_account_id).to.equal(accountInvite.invitee_account_id)
    should.not.exist(invitations[1].invitee_email)
    // Insert Stream Participant
    const streamParticipantInfo = {
      streamId:stream.id,
      accountId:accountId,
    }
    const streamParticipantStart = new Date(new Date().getTime())
    const streamParticipant = await insertStreamParticipant(streamParticipantInfo)
    // Check to make sure Stream Participant was inserted correctly
    expect(streamParticipant.stream_id).to.equal(streamParticipantInfo.streamId)
    expect(streamParticipant.account_id).to.equal(streamParticipantInfo.accountId)
    expect(streamParticipant.start_time.getTime() - streamParticipantStart.getTime()).to.be.within(0,1)
    should.not.exist(streamParticipant.end_time)
    // Fetch Stream Participants
    const participants = await getStreamParticipants(stream.id)
    // Check to make sure Stream Participants were fetched correctly
    expect(participants.length).to.equal(1)
    expect(participants[0].id).to.equal(streamParticipant.id)
    expect(participants[0].stream_id).to.equal(streamParticipant.stream_id)
    expect(participants[0].account_id).to.equal(streamParticipant.account_id)
    expect(participants[0].start_time.getTime()).to.equal(streamParticipant.start_time.getTime())
    should.not.exist(participants[0].end_time)
    // Update Stream Participant End Time
    const streamParticipantEndBenchmark = new Date(new Date().getTime())
    const streamParticipantEnd = await updateStreamParticipantEndTime(streamParticipant.id)
    // Check to make sure Stream Participant End Time was updated correctly
    expect(streamParticipantEnd.id).to.equal(streamParticipant.id)
    expect(streamParticipantEnd.end_time.getTime() - streamParticipantEndBenchmark.getTime()).to.be.within(0,1)
    // Update Stream End Time
    const streamEndBenchmark = new Date(new Date().getTime())
    const streamEnd = await updateStreamEndTime(stream.id)
    // Check to make sure Stream End Time was updated correctly
    expect(streamEnd.id).to.equal(stream.id)
    expect(streamEnd.end_time.getTime() - streamEndBenchmark.getTime()).to.be.within(0,1)
  })
})
