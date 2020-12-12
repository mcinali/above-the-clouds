const should = require('chai').should()
const expect = require('chai').expect
const { pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')

const { storeAccount, storeAccountDetails } = require('../models/accounts')

describe('DB Migrations Tests', function() {
  it(`Should...
    - Run DB Migrations`, async function() {
      await pgMigrate()
    })
})

describe('Accounts Models Tests', function() {
  it(`Should...
      - Insert test Account
      - Check to make sure correct Account info
      - Insert test Account Details
      - Check to make sure correct Account details`, async function() {
    // Insert test Account
    const accountInfo = {
      username:'testAccount',
      password:'testPassword',
    }

    // Remove account if already exists
    await pgTransaction(`DELETE FROM accounts WHERE username = '${accountInfo.username}'`)
    const account = await storeAccount(accountInfo)
    expect(account.username).to.equal(accountInfo.username)
    should.exist(account.password)

    const accountDetails = {
      account_id: account.id,
      email: 'test@email.com',
      phone:1234567890,
      firstname:'Test',
      lastname:'Account',
    }
    await pgTransaction(`DELETE FROM accounts_details WHERE account_id = ${accountDetails.account_id}`)
    const accountAttributes = await storeAccountDetails(accountDetails)
    expect(accountAttributes.account_id).to.equal(accountDetails.account_id)
    expect(accountAttributes.email).to.equal(accountDetails.email)
    expect(Number(accountAttributes.phone)).to.equal(accountDetails.phone)
    expect(accountAttributes.firstname).to.equal(accountDetails.firstname)
    expect(accountAttributes.lastname).to.equal(accountDetails.lastname)

  })
})
