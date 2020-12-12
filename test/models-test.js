const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')

const { storeAccount, storeAccountDetails } = require('../models/accounts')
const { storeQuestion } = require('../models/questions')

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
      - Check to make sure correct Account info
      - Insert test Account Details
      - Check to make sure correct Account details`, async function() {
    // Insert test Account
    const accountInfo = {
      username:testUsername,
      password:'testPassword',
    }
    // Check to make sure correct Account info
    await pgTransaction(`DELETE FROM accounts WHERE username = '${accountInfo.username}'`)
    const account = await storeAccount(accountInfo)
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
    // Check to make sure correct Account details
    await pgTransaction(`DELETE FROM accounts_details WHERE account_id = ${accountDetails.accountId}`)
    const accountAttributes = await storeAccountDetails(accountDetails)
    expect(accountAttributes.account_id).to.equal(accountDetails.accountId)
    expect(accountAttributes.email).to.equal(accountDetails.email)
    expect(Number(accountAttributes.phone)).to.equal(accountDetails.phone)
    expect(accountAttributes.firstname).to.equal(accountDetails.firstname)
    expect(accountAttributes.lastname).to.equal(accountDetails.lastname)

  })
})

describe('Questions Tests', function() {
  it(`Should...
      - Insert test Question
      - Check to make sure correct Question info`, async function() {
    // Insert test Question
    const accountRow = await getAccountRow()
    const accountId = accountRow.id
    const questionInfo = {
      accountId:accountId,
      question:'What do you want to talk about?',
    }
    // Check to make sure correct Question info
    const question = await storeQuestion(questionInfo)
    expect(question.account_id).to.equal(questionInfo.accountId)
    expect(question.question).to.equal(questionInfo.question)
  })
})
