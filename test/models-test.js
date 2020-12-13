const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')

const { insertAccount, insertAccountDetails } = require('../models/accounts')
const {
  insertTopic,
  insertThreadToStart,
  updateEndThread,
  insertThreadParticipant,
  updateParticipantRole,
  updateRemoveParticipant,
  insertThreadInvitation,
  selectThreadsForUser,
  selectThreadParticipants,
} = require('../models/threads')

const testUsername = 'testAccount'

async function getAccountRow(){
  return pool
          .query(`SELECT id from accounts where username = '${testUsername}'`)
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
      - Check to make sure Account details are correct`, async function() {
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
    const accountDetails = {
      accountId: account.id,
      email: 'test@email.com',
      phone:1234567890,
      firstname:'Test',
      lastname:'Account',
    }
    await pgTransaction(`DELETE FROM account_details WHERE account_id = ${accountDetails.accountId}`)
    const accountAttributes = await insertAccountDetails(accountDetails)
    // Check to make sure Account details are correct
    expect(accountAttributes.account_id).to.equal(accountDetails.accountId)
    expect(accountAttributes.email).to.equal(accountDetails.email)
    expect(Number(accountAttributes.phone)).to.equal(accountDetails.phone)
    expect(accountAttributes.firstname).to.equal(accountDetails.firstname)
    expect(accountAttributes.lastname).to.equal(accountDetails.lastname)

  })
})

describe('Threads Tests', function() {
  it(`Should...
      - Insert test Topic
      - Check to make sure Topic info is correct
      - Insert Thread
      - Check to make sure Thread info is correct
      - Insert Thread Participant
      - Check to make sure Thread Participant info is correct
      - Update Thread Participant
      - Check to make sure Thread Participant info is correct
      - Insert Thread Invitation
      - Check to make sure Thread Invitation info is correct
      - Remove Thread Participant
      - Check to make sure Thread Participant is removed
      - End Thread
      - Check to make sure Ended Thread info is correct`, async function() {
    // Insert test topic
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    const topicInfo = {
      accountId:accountId,
      topic:'What do you want to talk about?',
    }
    const topic = await insertTopic(topicInfo)
    // Check to make sure Topic info is correct
    expect(topic.account_id).to.equal(topicInfo.accountId)
    expect(topic.topic).to.equal(topicInfo.topic)
    // Insert Thread
    const threadInfo = {
      topicId: topic.id,
      accountId: accountId,
      private: true,
    }
    const start = new Date(new Date().getTime())
    const thread = await insertThreadToStart(threadInfo)
    // Check to make sure Thread info is correct
    expect(thread.topic_id).to.equal(threadInfo.topicId)
    expect(thread.creator_id).to.equal(threadInfo.accountId)
    expect(thread.private).to.equal(threadInfo.private)
    expect(thread.start_time.getTime() - start.getTime()).to.be.within(0,1)
    // Insert Thread Participant
    const moderatorInfo = {
      threadId: thread.id,
      accountId: accountId,
      role: 'Moderator',
    }
    const moderator = await insertThreadParticipant(moderatorInfo)
    // Check to make sure Thread Participant info is correct
    expect(moderator.thread_id).to.equal(moderatorInfo.threadId)
    expect(moderator.account_id).to.equal(moderatorInfo.accountId)
    expect(moderator.role).to.equal(moderatorInfo.role)
    // Update Thread Participant
    const audienceInfo = {
      threadId: thread.id,
      accountId: accountId,
      role: 'Audience',
    }
    const audience = await updateParticipantRole(audienceInfo)
    // Check to make sure Thread Participant info is correct
    expect(audience.id).to.equal(moderator.id)
    expect(audience.thread_id).to.equal(audienceInfo.threadId)
    expect(audience.account_id).to.equal(audienceInfo.accountId)
    expect(audience.role).to.equal(audienceInfo.role)
    // Insert Thread Invitation
    const invitationInfo = {
      threadId: thread.id,
      moderatorId: accountId,
      inviteeEmail: 'invitee@test.com'
    }
    const invite = await insertThreadInvitation(invitationInfo)
    // Check to make sure Thread Invitation info is correct
    expect(invite.thread_id).to.equal(invitationInfo.threadId)
    expect(invite.moderator_id).to.equal(invitationInfo.moderatorId)
    expect(invite.invitee_email).to.equal(invitationInfo.inviteeEmail)
    // Remove Thread Participant
    const removedParticipant = await updateRemoveParticipant(audienceInfo)
    // Check to make sure Thread Participant is removed
    expect(removedParticipant.removed).to.equal(true)
    // End Thread
    const end = new Date(new Date().getTime())
    const endedThread = await updateEndThread(thread.id)
    // Check to make sure Ended Thread info is correct
    expect(endedThread.end_time.getTime() - end.getTime()).to.be.within(0,1)
  })
})
