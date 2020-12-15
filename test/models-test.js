const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')
const {
  insertAccount,
  insertAccountDetails,
  getAccountDetails,
} = require('../models/accounts')
const {
  insertTopic,
  insertThreadToStart,
  insertThreadInvitation,
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

describe('Threads Tests', function() {
  it(`Should...
      - Insert test Topic
      - Check to make sure Topic info is correct
      - Insert Thread
      - Check to make sure Thread info is correct
      - Insert Thread Invitation with Account ID
      - Check to make sure Thread Invitation with Account ID info is correct
      - Insert Thread Invitation with Email
      - Check to make sure Thread Invitation with Email is correct`, async function() {
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
    }
    const start = new Date(new Date().getTime())
    const thread = await insertThreadToStart(threadInfo)
    // Check to make sure Thread info is correct
    expect(thread.topic_id).to.equal(threadInfo.topicId)
    expect(thread.creator_id).to.equal(threadInfo.accountId)
    expect(thread.start_time.getTime() - start.getTime()).to.be.within(0,1)
    // Check to make sure Thread Invitation with Account ID info is correct
    const accountInvitationInfo = {
      threadId: thread.id,
      inviterAccountId: accountId,
      inviteeAccountId: accountId,
      inviteeEmail:null,
    }
    const accountInvitation = await insertThreadInvitation(accountInvitationInfo)
    // Insert Thread Invitation with Account ID
    expect(accountInvitation.thread_id).to.equal(accountInvitationInfo.threadId)
    expect(accountInvitation.inviter_account_id).to.equal(accountInvitationInfo.inviterAccountId)
    expect(accountInvitation.invitee_account_id).to.equal(accountInvitationInfo.inviteeAccountId)
    should.not.exist(accountInvitation.invitee_email)
    // Insert Thread Invitation with Email
    const emailInvitationInfo = {
      threadId: thread.id,
      inviterAccountId: accountId,
      inviteeAccountId: null,
      inviteeEmail:'invite@test.com',
    }
    const emailInvitation = await insertThreadInvitation(emailInvitationInfo)
    // Check to make sure Thread Invitation with Email is correct
    expect(emailInvitation.thread_id).to.equal(emailInvitationInfo.threadId)
    expect(emailInvitation.inviter_account_id).to.equal(emailInvitationInfo.inviterAccountId)
    expect(emailInvitation.invitee_email).to.equal(emailInvitationInfo.inviteeEmail)
    should.not.exist(emailInvitation.invitee_account_id)
  })
})
