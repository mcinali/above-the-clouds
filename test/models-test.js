const should = require('chai').should()
const expect = require('chai').expect
const { pool, pgTransaction } = require('../pg_helpers')
const { pgMigrate } = require('../pg_migrations')
const {
  insertEmailAccessCodes,
  fetchEmailAccessTokenFromAccessCode,
  verifyEmailAccessToken,
  insertPhoneAccessCodes,
  fetchPhoneAccessTokenFromAccessCode,
  verifyPhoneAccessToken,
} = require('../models/preregistration')
const {
  insertAccount,
  getAccountInfo,
  insertAccountDetails,
  getAccountDetails,
  insertProfilePic,
  getProfilePic,
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountIdFromPhone,
  fuzzyMatchAccountsByUsername,
  fuzzyMatchAccountsByEmail,
  fuzzyMatchAccountsByFullName,
} = require('../models/accounts')
const {
  insertAccessToken,
  getPasswordFromUsername,
  getAccessTokenFromAccountId,
  insertPasswordReset,
  getPasswordResetInfo,
  updatePassword,
  expirePasswordResetCode,
} = require('../models/auth')
const {
  insertInvitation,
  checkInvitationCode,
  getEmailFromInvitationId,
  getInvitationsToEmail,
  getInvitationsFromAccount,
  insertInvitationCodeConversion,
  checkInvitationCodeConversion,
  getInvitationIdForConvertedAccount,
} = require('../models/invitations')
const {
  insertFollow,
  checkFollowStatus,
  updateFollowStatus,
  getAccountsFollowing,
  getAccountFollowers,
} = require('../models/follows')
const {
  insertTopic,
  getTopicInfo,
  getRecentTopics,
} = require('../models/topics')
const {
  insertStream,
  getStreamDetails,
  insertStreamInvitation,
  getStreamInvitations,
  insertStreamParticipant,
  getStreamParticipantDetails,
  getStreamParticipants,
  getActiveAccountStreams,
  updateStreamParticipantEndTime,
  updateStreamEndTime,
} = require('../models/streams')
const {
  getStreamCreationsForAccount,
  getStreamInvitationsForAccount,
} = require('../models/discovery')
const {
  insertSocketConnection,
  getActiveAccountSocketConnections,
  getRecentAccountSocketConnections,
  updateSocketDisconnection,
} = require('../models/sockets')
const {
  insertOnlineBroadcast,
  getRecentOnlineBroadcasts,
} = require('../models/broadcast')

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

describe('Pre-Registration Tests', function() {
  it(`Should...
    - Insert email access codes
    - Verify email access codes
    - Fetch email access token using email access code
    - Verify email access token
    - Insert phone access codes
    - Verify phone access codes
    - Fetch phone access token using phone access code
    - Verify phone access token`, async function() {
      const emailAccessCodeInfo = {
        email: 'test@email.com',
        accessCode: `123456`,
        accessCodeTTL: 1,
        accessToken: 'testToken',
        accessTokenTTL: 5,
      }
      const expiredEmailAccessCodeInfo = {
        email: 'expiredtest@email.com',
        accessCode: `123456`,
        accessCodeTTL: 0,
        accessToken: 'testToken',
        accessTokenTTL: 0,
      }
      await pgTransaction(`DELETE FROM registration_email_access_codes WHERE email = '${emailAccessCodeInfo.email}' OR email = '${expiredEmailAccessCodeInfo.email}'`)
      // Insert email access codes
      const emailAccessCodes = await insertEmailAccessCodes(emailAccessCodeInfo)
      const expiredEmailAccessCodes = await insertEmailAccessCodes(expiredEmailAccessCodeInfo)
      // Verify email access codes
      expect(emailAccessCodes.email).to.equal(emailAccessCodeInfo.email)
      expect(emailAccessCodes.accessCode).to.equal(emailAccessCodeInfo.accessCode)
      expect(emailAccessCodes.accessToken).to.equal(emailAccessCodeInfo.accessToken)
      expect(expiredEmailAccessCodes.email).to.equal(expiredEmailAccessCodeInfo.email)
      expect(expiredEmailAccessCodes.accessCode).to.equal(expiredEmailAccessCodeInfo.accessCode)
      expect(expiredEmailAccessCodes.accessToken).to.equal(expiredEmailAccessCodeInfo.accessToken)
      // Fetch email access token using email access code
      const emailAccessToken = await fetchEmailAccessTokenFromAccessCode(emailAccessCodeInfo)
      const expiredEmailAccessToken = await fetchEmailAccessTokenFromAccessCode(expiredEmailAccessCodeInfo)
      const badEmailAccessToken = await fetchEmailAccessTokenFromAccessCode({email: 'bad', accessCode: emailAccessCodeInfo.accessCode})
      const badEmailAccessCodeAccessToken = await fetchEmailAccessTokenFromAccessCode({email: emailAccessCodeInfo.email, accessCode: 000000})
      expect(emailAccessToken[0].accessToken).to.equal(emailAccessCodeInfo.accessToken)
      expect(emailAccessToken[0].expired).to.equal(false)
      expect(expiredEmailAccessToken[0].accessToken).to.equal(expiredEmailAccessCodeInfo.accessToken)
      expect(expiredEmailAccessToken[0].expired).to.equal(true)
      should.not.exist(badEmailAccessToken[0])
      should.not.exist(badEmailAccessCodeAccessToken[0])
      // Verify email access token
      const activeEmailToken = await verifyEmailAccessToken(emailAccessCodeInfo)
      expect(activeEmailToken[0].expired).to.equal(false)
      const expiredEmailToken = await verifyEmailAccessToken(expiredEmailAccessCodeInfo)
      expect(expiredEmailToken[0].expired).to.equal(true)

      const phoneAccessCodeInfo = {
        phone: 1234567890,
        accessCode: `000000`,
        accessCodeTTL: 1,
        accessToken: 'testToken',
        accessTokenTTL: 5,
      }
      const expiredPhoneAccessCodeInfo = {
        phone: 1234567891,
        accessCode: '001000',
        accessCodeTTL: 0,
        accessToken: 'testToken',
        accessTokenTTL: 0,
      }
      await pgTransaction(`DELETE FROM registration_phone_access_codes WHERE phone = ${phoneAccessCodeInfo.phone} OR phone = ${expiredPhoneAccessCodeInfo.phone}`)
      // Insert phone access codes
      const phoneAccessCodes = await insertPhoneAccessCodes(phoneAccessCodeInfo)
      const expiredPhoneAccessCodes = await insertPhoneAccessCodes(expiredPhoneAccessCodeInfo)
      // Verify email access codes
      expect(parseInt(phoneAccessCodes.phone)).to.equal(phoneAccessCodeInfo.phone)
      expect(phoneAccessCodes.accessCode).to.equal(phoneAccessCodeInfo.accessCode)
      expect(phoneAccessCodes.accessToken).to.equal(phoneAccessCodeInfo.accessToken)
      expect(parseInt(expiredPhoneAccessCodes.phone)).to.equal(expiredPhoneAccessCodeInfo.phone)
      expect(expiredPhoneAccessCodes.accessCode).to.equal(expiredPhoneAccessCodeInfo.accessCode)
      expect(expiredPhoneAccessCodes.accessToken).to.equal(expiredPhoneAccessCodeInfo.accessToken)
      // Fetch phone access token using email access code
      const phoneAccessToken = await fetchPhoneAccessTokenFromAccessCode(phoneAccessCodeInfo)
      const expiredPhoneAccessToken = await fetchPhoneAccessTokenFromAccessCode(expiredPhoneAccessCodeInfo)
      const badPhoneAccessToken = await fetchPhoneAccessTokenFromAccessCode({phone: 1234567892, accessCode: phoneAccessCodeInfo.accessCode})
      const badPhoneAccessCodeAccessToken = await fetchPhoneAccessTokenFromAccessCode({phone: phoneAccessCodeInfo.phone, accessCode: 000000})
      expect(phoneAccessToken[0].accessToken).to.equal(phoneAccessCodeInfo.accessToken)
      expect(phoneAccessToken[0].expired).to.equal(false)
      expect(expiredPhoneAccessToken[0].accessToken).to.equal(expiredPhoneAccessCodeInfo.accessToken)
      expect(expiredPhoneAccessToken[0].expired).to.equal(true)
      should.not.exist(badPhoneAccessToken[0])
      should.not.exist(badPhoneAccessCodeAccessToken[0])
      // Verify phone access token
      const activePhoneToken = await verifyPhoneAccessToken(phoneAccessCodeInfo)
      expect(activePhoneToken[0].expired).to.equal(false)
      const expiredPhoneToken = await verifyPhoneAccessToken(expiredPhoneAccessCodeInfo)
      expect(expiredPhoneToken[0].expired).to.equal(true)
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
    - Insert profile pic into db
    - Check to make sure profile pic was inserted correctly
    - Fetch profile pic
    - Check to make sure profile pic was fetched correctly
    - Fetch Username from Account
    - Check to make sure Username from Account was fetched correctly
    - Fetch Account Id from Username
    - Check to make sure Account Id from Username was fetched correctly
    - Fetch Account Id from Email
    - Check to make sure Account Id from Email was fetched correctly
    - Fetch Account Id from Phone
    - Check to make sure Account Id from Phone was fetched correctly
    - Fetch Account from Fuzzy Match Username
    - Check to make sure Account from Fuzzy Match Username was fetched correctly
    - Fetch Account from Fuzzy Match Email
    - Check to make sure Account from Fuzzy Match Email was fetched correctly
    - Fetch Account from Fuzzy Match Full Name
    - Check to make sure Account from Fuzzy Match Full Name was fetched correctly`, async function() {
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
      // Check to make sure Account Details were fetched correctly
      expect(accountDetailsFetched.accountId).to.equal(accountDetailsInfo.accountId)
      expect(accountDetailsFetched.email).to.equal(accountDetailsInfo.email)
      expect(Number(accountDetailsFetched.phone)).to.equal(accountDetailsInfo.phone)
      expect(accountDetailsFetched.firstname).to.equal(accountDetailsInfo.firstname)
      expect(accountDetailsFetched.lastname).to.equal(accountDetailsInfo.lastname)
      // Insert profile pic into db
      const profilePicInfo = {
        accountId: account.id,
        imageData: [0, 0, 0, 1, 2, 3, 4 , 5, 6],
      }
      const profilePic = await insertProfilePic(profilePicInfo)
      // Check to make sure profile pic was inserted correctly
      expect(profilePic.accountId).to.equal(profilePicInfo.accountId)
      expect(profilePic.profilePicture).to.equal(profilePicInfo.imageData.toString())
      // Fetch profile pic
      const fetchedProfilePic = await getProfilePic(account.id)
      // Check to make sure profile pic was fetched correctly
      expect(fetchedProfilePic.profilePicture).to.equal(profilePicInfo.imageData.toString())
      // Fetch Username from Account
      const username = await getAccountInfo(account.id)
      // Check to make sure Username from Account was fetched correctly
      expect(username.username).to.equal(accountInfo.username)
      // Fetch Account Id from Username
      const acccountIdFromUsernameValid = await getAccountIdFromUsername(accountInfo.username)
      const acccountIdFromUsernameInValid = await getAccountIdFromUsername('invalidusername')
      // Check to make sure Account Id from Username was fetched correctly
      expect(acccountIdFromUsernameValid.id).to.equal(account.id)
      should.not.exist(acccountIdFromUsernameInValid)
      // Fetch Account Id from Email
      const acccountIdFromEmailValid = await getAccountIdFromEmail(accountDetailsInfo.email)
      const acccountIdFromEmailInValid = await getAccountIdFromEmail('invalidemail@eamil.com')
      // Check to make sure Account Id from Email was fetched correctly
      expect(acccountIdFromEmailValid.accountId).to.equal(account.id)
      should.not.exist(acccountIdFromEmailInValid)
      // Fetch Account Id from Phone
      const acccountIdFromPhoneValid = await getAccountIdFromPhone(accountDetailsInfo.phone)
      const acccountIdFromPhoneInValid = await getAccountIdFromPhone(null)
      // Check to make sure Account Id from Phone was fetched correctly
      expect(acccountIdFromPhoneValid.accountId).to.equal(account.id)
      should.not.exist(acccountIdFromPhoneInValid)
      // Fetch Account from Fuzzy Match Username
      const fuzzyMatchUsername = testUsername.substring(0,7)
      const fuzzyMatchUsernameUpper =  fuzzyMatchUsername.toUpperCase()
      const accountFromFuzzyMatchUsernameGood1 = await fuzzyMatchAccountsByUsername(fuzzyMatchUsername)
      const accountFromFuzzyMatchUsernameGood2 = await fuzzyMatchAccountsByUsername(fuzzyMatchUsernameUpper)
      const accountFromFuzzyMatchUsernameBad = await fuzzyMatchAccountsByUsername('bad')
      // Check to make sure Account from Fuzzy Match Username was fetched correctly
      expect(accountFromFuzzyMatchUsernameGood1.length).to.equal(1)
      expect(accountFromFuzzyMatchUsernameGood1[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchUsernameGood2.length).to.equal(1)
      expect(accountFromFuzzyMatchUsernameGood2[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchUsernameBad.length).to.equal(0)
      // Fetch Account from Fuzzy Match Email
      const fuzzyMatchEmail = accountDetailsInfo.email.substring(0,7)
      const fuzzyMatchEmailUpper = fuzzyMatchEmail.toUpperCase()
      const accountFromFuzzyMatchEmailGood1 = await fuzzyMatchAccountsByEmail(fuzzyMatchEmail)
      const accountFromFuzzyMatchEmailGood2 = await fuzzyMatchAccountsByEmail(fuzzyMatchEmailUpper)
      const accountFromFuzzyMatchEmailBad = await fuzzyMatchAccountsByEmail('bad')
      // Check to make sure Account from Fuzzy Match Email was fetched correctly
      expect(accountFromFuzzyMatchEmailGood1.length).to.equal(1)
      expect(accountFromFuzzyMatchEmailGood1[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchEmailGood2.length).to.equal(1)
      expect(accountFromFuzzyMatchEmailGood2[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchEmailBad.length).to.equal(0)
      // Fetch Account from Fuzzy Match Full Name
      const fuzzyMatchFirstname = accountDetailsInfo.firstname.substring(0,2)
      const fuzzyMatchLastname = accountDetailsInfo.lastname.substring(0,2)
      const fuzzyMatchFirstnameUpper = fuzzyMatchFirstname
      const fuzzyMatchLastnameUpper = fuzzyMatchLastname
      const accountFromFuzzyMatchFullNameGood1 = await fuzzyMatchAccountsByFullName(fuzzyMatchFirstname, fuzzyMatchLastname)
      const accountFromFuzzyMatchFullNameGood2 = await fuzzyMatchAccountsByFullName('', fuzzyMatchLastname)
      const accountFromFuzzyMatchFullNameGood3 = await fuzzyMatchAccountsByFullName(fuzzyMatchFirstname, '')
      const accountFromFuzzyMatchFullNameGood4 = await fuzzyMatchAccountsByFullName(fuzzyMatchFirstnameUpper, fuzzyMatchLastnameUpper)
      const accountFromFuzzyMatchFullNameBad1 = await fuzzyMatchAccountsByFullName('bad','')
      const accountFromFuzzyMatchFullNameBad2 = await fuzzyMatchAccountsByFullName('','bad')
      const accountFromFuzzyMatchFullNameBad3 = await fuzzyMatchAccountsByFullName('bad','bad')
      // Check to make sure Account from Fuzzy Match Full Name was fetched correctly
      expect(accountFromFuzzyMatchFullNameGood1.length).to.equal(1)
      expect(accountFromFuzzyMatchFullNameGood1[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchFullNameGood2.length).to.equal(1)
      expect(accountFromFuzzyMatchFullNameGood2[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchFullNameGood3.length).to.be.above(0)
      expect(accountFromFuzzyMatchFullNameGood4.length).to.equal(1)
      expect(accountFromFuzzyMatchFullNameGood4[0].accountId).to.equal(account.id)
      expect(accountFromFuzzyMatchFullNameBad1.length).to.equal(0)
      expect(accountFromFuzzyMatchFullNameBad2.length).to.equal(0)
      expect(accountFromFuzzyMatchFullNameBad3.length).to.equal(0)
  })
})

describe('Auth Tests', function() {
  it(`Should...
    - Insert auth test account & account detials
    - Insert access token
    - Make sure access token was inserted correctly
    - Fetch password
    - Make sure password was fetched correctly
    - Fetch access token from accountId
    - Make sure access token from accountId was fetched correctly
    - Insert password reset info
    - Make sure password reset info was inserted correctly
    - Fetch password reset info
    - Make sure password reset info was fetched correctly
    - Update password
    - Make sure password was updated correctly
    - Expire password reset code
    - Make sure password reset code was expired correctly`, async function() {
      // Insert auth test account & account detials
      const accountInfo = {
        username:'authTest',
        password:'authTestPassword',
      }
      await pgTransaction(`DELETE FROM accounts WHERE username = '${accountInfo.username}'`)
      const account = await insertAccount(accountInfo)
      const accountDetailsInfo = {
        accountId: account.id,
        email: 'auth@test.com',
        phone:9129239456,
        firstname:'Auth',
        lastname:'Test',
      }
      const accountDetails = await insertAccountDetails(accountDetailsInfo)
      // Insert access token
      const accessTokenInfo = {
        accountId: account.id,
        accessToken: 'token',
        accessTokenTTL: 1,
      }
      const before = new Date(new Date().getTime()).getTime()
      const accessToken = await insertAccessToken(accessTokenInfo)
      const after = new Date(new Date().getTime()).getTime()
      // Make sure access token was inserted correctly
      expect(accessToken.accountId).to.equal(accessTokenInfo.accountId)
      expect(accessToken.accessToken).to.equal(accessTokenInfo.accessToken)
      expect(accessToken.accessTokenExpiration.getTime()).to.be.above(before)
      expect(accessToken.accessTokenExpiration.getTime()).to.be.below(after+(accessTokenInfo.accessTokenTTL*24*60*60*1000))
      // Fetch password
      const goodPasswordRow = await getPasswordFromUsername(accountInfo.username)
      const badPasswordRow = await getPasswordFromUsername('@uthTest')
      const goodPassword = goodPasswordRow.password
      // Make sure password was fetched correctly
      expect(goodPassword).to.equal(accountInfo.password)
      should.not.exist(badPasswordRow)
      // Fetch access token from accountId
      const accessTokenRows = await getAccessTokenFromAccountId(account.id)
      // Make sure access token from accountId was fetched correctly
      expect(accessTokenRows.length).to.equal(1)
      expect(accessTokenRows[0].accessToken).to.equal(accessTokenInfo.accessToken)
      // Insert password reset info
      const passwordResetInfo = {
        accountId: account.id,
        resetCode: 'abc123',
        resetToken: 'tokenabc123',
        verificationCode: '123456',
        resetTTL: 1,
      }
      const before2 = new Date(new Date().getTime()).getTime()
      const passwordReset = await insertPasswordReset(passwordResetInfo)
      const after2 = new Date(new Date().getTime()).getTime()
      // Make sure password reset info was inserted correctly
      expect(passwordReset.accountId).to.equal(passwordResetInfo.accountId)
      expect(passwordReset.resetCode).to.equal(passwordResetInfo.resetCode)
      expect(passwordReset.resetToken).to.equal(passwordResetInfo.resetToken)
      expect(passwordReset.verificationCode).to.equal(passwordResetInfo.verificationCode)
      expect(passwordReset.used).to.equal(false)
      expect(passwordReset.expiration.getTime()).to.be.above(before2)
      expect(passwordReset.expiration.getTime()).to.be.below(after2+(passwordResetInfo.resetTTL*60*60*1000))
      // Fetch password reset info
      const fetchedPasswordResetInfo = await getPasswordResetInfo(passwordResetInfo.resetCode)
      // Make sure password reset info was fetched correctly
      expect(fetchedPasswordResetInfo.id).to.equal(passwordReset.id)
      expect(fetchedPasswordResetInfo.accountId).to.equal(passwordReset.accountId)
      expect(fetchedPasswordResetInfo.resetCode).to.equal(passwordReset.resetCode)
      expect(fetchedPasswordResetInfo.resetToken).to.equal(passwordReset.resetToken)
      expect(fetchedPasswordResetInfo.verificationCode).to.equal(passwordReset.verificationCode)
      expect(fetchedPasswordResetInfo.used).to.equal(passwordReset.used)
      expect(fetchedPasswordResetInfo.expiration.getTime()).to.equal(passwordReset.expiration.getTime())
      // Update password
      const passwordUpdateInfo = {
        accountId: account.id,
        password: 'updatedPassword',
      }
      const updatedPassword = await updatePassword(passwordUpdateInfo)
      // Make sure password was updated correctly
      expect(updatedPassword.accountId).to.equal(passwordUpdateInfo.accountId)
      expect(updatedPassword.password).to.equal(passwordUpdateInfo.password)
      expect(updatedPassword.password).to.not.equal(accountInfo.password)
      // Expire password reset code
      const expiredPasswordResetCode = await expirePasswordResetCode(passwordResetInfo.resetCode)
      // Make sure password reset code was expired correctly
      expect(expiredPasswordResetCode.id).to.equal(passwordReset.id)
      expect(expiredPasswordResetCode.accountId).to.equal(passwordReset.accountId)
      expect(expiredPasswordResetCode.resetCode).to.equal(passwordReset.resetCode)
      expect(expiredPasswordResetCode.used).to.equal(true)
    })
  })

describe('Invitations Tests', function() {
  it(`Should...
    - Insert invitation
    - Verify invitation was inserted correctly
    - Insert expired invitation Code
    - Check invitation code
    - Make sure invitation code check was successful
    - Fetch email from invitation code
    - Make sure email from invitation code was fetched correctly
    - Fetch invitations to email
    - Verify invitations to email were fetched correctly
    - Fetch invitations from account
    - Verify invitations from account were fetched correctly
    - Insert invitation code conversion
    - Make sure invitation code conversion was inserted correctly
    - Check invitation code conversion
    - Make sure invitation code conversion check was successful
    - Fetch invitation code id from converted account id
    - Make sure invitation code id from converted account id was fetched correctly `, async function() {
      // Insert invitation
      const accountRow = await getAccountRow()
      const accountId = accountRow.id
      const invitationInfo = {
        accountId: accountId,
        email: 'invitation@test.com',
        invitationCode: '-1',
        invitationCodeTTL: 1,
      }
      const invitation = await insertInvitation(invitationInfo)
      // Verify invitation was inserted correctly
      expect(invitation.accountId).to.equal(accountId)
      expect(invitation.email).to.equal(invitationInfo.email)
      expect(invitation.invitationCode).to.equal(invitationInfo.invitationCode)
      // Insert expired invitation Code
      const expiredInvitationInfo = {
        accountId: accountId,
        email: 'expiredinvitation@test.com',
        invitationCode: '-2',
        invitationCodeTTL: 0,
      }
      const expiredInvitation = await insertInvitation(expiredInvitationInfo)
      // Check invitation code
      const goodInvitationCodeIdRow = await checkInvitationCode(invitationInfo.invitationCode)
      const badInvitationCodeIdRow = await checkInvitationCode('badInvitationCode')
      const expiredInvitationCodeIdRow = await checkInvitationCode(expiredInvitationInfo.invitationCode)
      // Make sure invitation code check was successful
      expect(goodInvitationCodeIdRow[0].id).to.equal(invitation.id)
      should.not.exist(badInvitationCodeIdRow[0])
      should.not.exist(expiredInvitationCodeIdRow[0])
      // Fetch email from invitation code
      const goodInvitationCodeCheck = await getEmailFromInvitationId(invitation.id)
      const badInvitationCodeCheck = await getEmailFromInvitationId(-1)
      // Make sure email from invitation code was fetched correctly
      expect(goodInvitationCodeCheck[0].email).to.equal(invitationInfo.email)
      should.not.exist(badInvitationCodeCheck[0])
      // Fetch invitations to email
      const goodEmailFetch = await getInvitationsToEmail(invitationInfo.email)
      const badEmailFetch = await getInvitationsToEmail('bad@email.com')
      // Verify invitations to email were fetched correctly
      expect(goodEmailFetch[0].accountId).to.equal(accountId)
      should.not.exist(badEmailFetch[0])
      // Fetch invitations from account
      const goodAccountIdFetch = await getInvitationsFromAccount(accountId)
      const badAccountIdFetch = await getInvitationsFromAccount(-1)
      // Verify invitations from account were fetched correctly
      expect(goodAccountIdFetch[0].email).to.equal(invitationInfo.email)
      should.not.exist(badAccountIdFetch[0])
      // Insert invitation code conversion
      const invitationCodeConversionInfo = {
        accountId: accountId,
        invitationCodeId: invitation.id,
      }
      const invitationCodeConversion = await insertInvitationCodeConversion(invitationCodeConversionInfo)
      // Make sure invitation code conversion was inserted correctly
      expect(invitationCodeConversion.accountId).to.equal(invitationCodeConversionInfo.accountId)
      expect(invitationCodeConversion.invitationCodeId).to.equal(invitationCodeConversionInfo.invitationCodeId)
      // Check invitation code conversion
      const goodInvitationCodeConversionCheck = await checkInvitationCodeConversion(invitationCodeConversion.invitationCodeId)
      const badInvitationCodeConversionCheck = await checkInvitationCodeConversion(-1)
      // Make sure invitation code conversion check was successful
      expect(goodInvitationCodeConversionCheck[0].id).to.equal(invitationCodeConversion.id)
      should.not.exist(badInvitationCodeConversionCheck[0])
      // Fetch invitation code id from converted account id
      const goodInvitationCodeIdForConvertedAccount = await getInvitationIdForConvertedAccount(accountId)
      const badInvitationCodeIdForConvertedAccount = await getInvitationIdForConvertedAccount(-1)
      // Make sure invitation code id from converted account id was fetched correctly
      expect(goodInvitationCodeIdForConvertedAccount[0].invitationCodeId).to.equal(invitation.id)
      should.not.exist(badInvitationCodeIdForConvertedAccount[0])
    }
  )
})

describe('Follows Tests', function() {
  it(`Should...
    - Create Follow Test Account
    - Insert Follow
    - Make sure Follow was inserted correctly
    - Fetch Accounts Following
    - Make sure Accounts Following were fetched correctly
    - Fetch Account Followers
    - Make sure Account Followers were fetched correctly
    - Check follow status
    - Make sure follow status check was correct
    - Update follow status to unfollow = true
    - Make sure follow status to unfollow = true was updated correctly
    - Make sure follow info for unfollow = true is fetched correctly
    - Update follow status to unfollow = false
    - Make sure follow status to unfollow = false was updated correctly
    - Make sure follow info for unfollow = false is fetched correctly`, async function() {
      const accountRow = await getAccountRow()
      const accountId = accountRow.id
      // Create Follow Test Account
      const testFollowingUsername = 'followsTestAccount'
      await pgTransaction(`DELETE FROM accounts WHERE username = '${testFollowingUsername}'`)
      const testFollowingAccountInfo = {
        username: testFollowingUsername,
        password:'testFollowingPassword',
      }
      const followingAccount = await insertAccount(testFollowingAccountInfo)
      const followingAccountId = followingAccount.id
      const followingAccountDetailsInfo = {
        accountId: followingAccountId,
        email: 'testfollowing@email.com',
        phone:2345678901,
        firstname:'Test',
        lastname:'Follows',
      }
      const followingAccountDetails = await insertAccountDetails(followingAccountDetailsInfo)
      // Insert Follow
      const followsInfo = {
        accountId: accountId,
        followingAccountId: followingAccountId,
      }
      const follow = await insertFollow(followsInfo)
      // Make sure Follow was inserted correctly
      expect(follow.accountId).to.equal(follow.accountId)
      expect(follow.followingAccountId).to.equal(followsInfo.followingAccountId)
      // Fetch Accounts Following
      const goodAccountsFollowing = await getAccountsFollowing(accountId)
      const badAccountsFollowing = await getAccountsFollowing(followingAccountId)
      // Make sure Accounts Following were fetched correctly
      expect(goodAccountsFollowing[0].accountId).to.equal(followingAccountId)
      should.not.exist(badAccountsFollowing[0])
      // Fetch Account Followers
      const goodAccountFollowers = await getAccountFollowers(followingAccountId)
      const badAccountFollowers = await getAccountFollowers(accountId)
      // Make sure Account Followers were fetched correctly
      expect(goodAccountFollowers[0].accountId).to.equal(accountId)
      should.not.exist(badAccountFollowers[0])
      // Check follow status
      const goodFollowStatusCheck = await checkFollowStatus(followsInfo)
      const badFollowStatusCheck1 = await checkFollowStatus({accountId: -1, followingAccountId: followingAccountId})
      const badFollowStatusCheck2 = await checkFollowStatus({accountId: accountId, followingAccountId: -1})
      const badFollowStatusCheck3 = await checkFollowStatus({accountId: -1, followingAccountId: -1})
      // Make sure follower status check was correct
      expect(goodFollowStatusCheck[0].unfollow).to.equal(null)
      should.not.exist(badFollowStatusCheck1[0])
      should.not.exist(badFollowStatusCheck2[0])
      should.not.exist(badFollowStatusCheck3[0])
      // Update follower status to unfollow = true
      const unfollowInfo = {
        accountId:accountId,
        followingAccountId:followingAccountId,
        unfollow: true,
      }
      const unfollow = await updateFollowStatus(unfollowInfo)
      // Make sure follower status to unfollow = true was updated correctly
      expect(unfollow.accountId).to.equal(unfollowInfo.accountId)
      expect(unfollow.followingAccountId).to.equal(unfollowInfo.followingAccountId)
      expect(unfollow.unfollow).to.equal(unfollowInfo.unfollow)
      // Make sure follower info for unfollow = true is fetched correctly
      const unfollowCheck = await checkFollowStatus(unfollowInfo)
      expect(unfollowCheck[0].unfollow).to.equal(unfollowInfo.unfollow)
      const unfollowedFollowing = await getAccountsFollowing(accountId)
      should.not.exist(unfollowedFollowing[0])
      const unfollowingFollowers = await getAccountFollowers(followingAccountId)
      should.not.exist(unfollowingFollowers[0])
      // Update follower status to unfollow = false
      const refollowInfo = {
        accountId:accountId,
        followingAccountId:followingAccountId,
        unfollow: false,
      }
      const refollow = await updateFollowStatus(refollowInfo)
      // Make sure follower status to unfollow = false was updated correctly
      expect(refollow.accountId).to.equal(refollowInfo.accountId)
      expect(refollow.followerAccountId).to.equal(refollowInfo.followerAccountId)
      expect(refollow.unfollow).to.equal(refollowInfo.unfollow)
      // Make sure follower info for unfollow = false is fetched correctly
      const refollowCheck = await checkFollowStatus(refollowInfo)
      expect(refollowCheck[0].unfollow).to.equal(refollowInfo.unfollow)
      const refollowedFollowing = await getAccountsFollowing(accountId)
      expect(refollowedFollowing[0].accountId).to.equal(followingAccountId)
      const refollowingFollowers = await getAccountFollowers(followingAccountId)
      expect(refollowingFollowers[0].accountId).to.equal(accountId)
  })
})

describe('Topics Tests', function() {
  it(`Should...
    - Insert test Topic
    - Check to make sure Topic info is correct
    - Fetch Topic Info
    - Check to make sure Topic Info was fetched correctly
    - Fetch recent topics
    - Make sure recent topics were fetched correctly`, async function() {
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
      // Fetch Topic Info
      const fetchedTopicInfo = await getTopicInfo(topic.id)
      // Check to make sure Topic Info was fetched correctly
      expect(fetchedTopicInfo.id).to.equal(topic.id)
      expect(fetchedTopicInfo.accountId).to.equal(topic.accountId)
      expect(fetchedTopicInfo.topic).to.equal(topic.topic)
      expect(fetchedTopicInfo.createdAt.getTime()).to.equal(topic.createdAt.getTime())
      // Fetch recent topics
      const lookBackPeriod = 1
      const recentTopics = await getRecentTopics(lookBackPeriod)
      const noRecentTopics = await getRecentTopics(0)
      // Make sure recent topics were fetched correctly
      recentTopics.map(topicRow => {
        should.exist(topicRow.id)
        should.exist(topicRow.accountId)
        should.exist(topicRow.topic)
        const now = new Date(new Date().getTime()).getTime()
        const createdAtTS = topicRow.createdAt.getTime() + (lookBackPeriod*60*60*1000)
        expect(createdAtTS).to.be.above(now)
      })
      should.not.exist(noRecentTopics[0])
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
    - Insert Stream Participant
    - Check to make sure Stream Participant was inserted correctly
    - Fetch Stream Participant Details
    - Check to make sure Stream Participant Details were fetched correctly
    - Fetch Stream Participants
    - Check to make sure Stream Participants were fetched correctly
    - Fetch Active Streams for Account
    - Check to make sure Active Streams for Account were fetched correctly
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
        inviteOnly: true,
        capacity:4,
      }
      const streamStart = new Date(new Date().getTime())
      const stream = await insertStream(streamInfo)
      // Check to make sure Stream info was inserted correctly
      expect(stream.topicId).to.equal(streamInfo.topicId)
      expect(stream.creatorId).to.equal(streamInfo.accountId)
      expect(stream.inviteOnly).to.equal(streamInfo.inviteOnly)
      expect(stream.capacity).to.equal(streamInfo.capacity)
      expect(stream.startTime.getTime() - streamStart.getTime()).to.be.within(0,1)
      should.not.exist(stream.endTime)
      // Fetch Stream Info
      const fetchedStream = await getStreamDetails(stream.id)
      // Check to make sure Stream info was fetched correctly
      expect(stream.id).to.equal(fetchedStream.id)
      expect(stream.topicId).to.equal(fetchedStream.topicId)
      expect(stream.creatorId).to.equal(fetchedStream.creatorId)
      expect(stream.inviteOnly).to.equal(fetchedStream.inviteOnly)
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
      // Fetch Stream Participant Details
      const streamParticipantDetails = await getStreamParticipantDetails(streamParticipant.id)
      // Check to make sure Stream Participant Details were fetched correctly
      expect(streamParticipantDetails.id).to.equal(streamParticipant.id)
      expect(streamParticipantDetails.streamId).to.equal(streamParticipant.streamId)
      expect(streamParticipantDetails.accountId).to.equal(streamParticipant.accountId)
      expect(streamParticipantDetails.startTime.getTime()).to.equal(streamParticipant.startTime.getTime())
      should.not.exist(streamParticipantDetails.endTime)
      // Fetch Stream Participants
      const participants = await getStreamParticipants(stream.id)
      // Check to make sure Stream Participants were fetched correctly
      expect(participants.length).to.equal(1)
      expect(participants[0].id).to.equal(streamParticipant.id)
      expect(participants[0].streamId).to.equal(streamParticipant.streamId)
      expect(participants[0].accountId).to.equal(streamParticipant.accountId)
      expect(participants[0].startTime.getTime()).to.equal(streamParticipant.startTime.getTime())
      should.not.exist(participants[0].endTime)
      // Fetch Active Streams for Account
      const activeAccountStreams = await getActiveAccountStreams(accountId)
      // Check to make sure Active Streams for Account were fetched correctly
      expect(activeAccountStreams[0].id).to.equal(streamParticipant.id)
      expect(activeAccountStreams[0].streamId).to.equal(streamParticipant.streamId)
      expect(activeAccountStreams[0].accountId).to.equal(streamParticipant.accountId)
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

describe('Discovery Tests', function() {
  it(`Should...
    - Insert new test Account
    - Insert new Topic
    - Insert Stream
    - Fetch Streams Account created
    - Make sure Account created Streams were fetched correctly
    - Insert Stream Invitations for Stream
    - Fetch Active Stream Invitations for Account
    - Check to make sure Active Stream Invitations for Account were fetched correctly`, async function() {
      // Insert new test Account
      const discoveryTestAccountUsername = 'discoveryTestAccount'
      await pgTransaction(`DELETE FROM accounts WHERE username = '${discoveryTestAccountUsername}'`)
      const discoveryTestAccountInfo = {
        username:discoveryTestAccountUsername,
        password:'discoveryTestAccountPassword',
      }
      const discoveryTestAccount = await insertAccount(discoveryTestAccountInfo)
      const accountId = discoveryTestAccount.id
      const discoveryTestAccountDetailsInfo = {
        accountId: accountId,
        email: 'discovery@test.com',
        phone:1001001111,
        firstname:'Test',
        lastname:'Discovery',
      }
      const discoveryTestAccountDetails = await insertAccountDetails(discoveryTestAccountDetailsInfo)
      // Insert new Topic
      const topicInfo = {
        accountId:accountId,
        topic:"Can we test discovery topics?",
      }
      const topic = await insertTopic(topicInfo)
      // Insert Stream
      const streamInfo = {
        topicId: topic.id,
        accountId: accountId,
        inviteOnly: false,
        capacity: 4,
      }
      const activeStream = await insertStream(streamInfo)
      // Fetch Streams Account created
      const accountCreatedStreams = await getStreamCreationsForAccount(accountId, 24)
      const expiredAccountCreatedStreams = await getStreamCreationsForAccount(accountId, 0)
      const noStreamAccountCreatedStreams = await getStreamCreationsForAccount(-1, 24)
      // Make sure Account created Streams were fetched correctly
      expect(accountCreatedStreams.length).to.equal(1)
      expect(accountCreatedStreams[0].id).to.equal(activeStream.id)
      expect(accountCreatedStreams[0].creatorId).to.equal(accountId)
      should.not.exist(expiredAccountCreatedStreams[0])
      should.not.exist(noStreamAccountCreatedStreams[0])
      // Insert Stream Invitations for Stream
      const streamInvitationInfo = {
        streamId:activeStream.id,
        accountId:accountId,
        inviteeAccountId:accountId,
      }
      const streamInvitation = await insertStreamInvitation(streamInvitationInfo)
      // Fetch Stream Invitations for Account
      const goodStreamInvitationsForAccount = await getStreamInvitationsForAccount(accountId, 24)
      const expiredStreamInvitationsForAccount = await getStreamInvitationsForAccount(accountId, 0)
      // Check to make sure Active Stream Invitations for Account were fetched correctly
      expect(goodStreamInvitationsForAccount.length).to.equal(1)
      expect(goodStreamInvitationsForAccount[0].id).to.equal(streamInvitation.id)
      expect(goodStreamInvitationsForAccount[0].streamId).to.equal(streamInvitationInfo.streamId)
      expect(goodStreamInvitationsForAccount[0].accountId).to.equal(streamInvitationInfo.accountId)
      expect(goodStreamInvitationsForAccount[0].inviteeAccountId).to.equal(streamInvitationInfo.inviteeAccountId)
      should.not.exist(expiredStreamInvitationsForAccount[0])
  })
})

describe('Sockets Tests', function() {
  it(`Should...
    - Insert new Socket Connection
    - Make sure Socket Connection inserted correctly
    - Fetch Active Socket Connections
    - Make sure Active Socket Connections were fetched correctly
    - Fetch Recent Socket Connections
    - Make sure Recent Socket Connections were fetched correctly
    - Update disconnected Socket Connection
    - Make sure disconnected Coket Connection was updated correctly
    - Fetch Active Socket Connections (disconnected)
    - Make sure Active Socket Connections (disconnected) were fetched correctly
    - Fetch Recent Socket Connections (disconnected)
    - Make sure Recent Socket Connections were fetched correctly (disconnected)`, async function() {
      // Insert new Socket Connection
      const accountRow = await getAccountRow()
      const accountId = accountRow.id
      const socketConnectionInfo = {
        accountId: accountId,
        socketId: 'abc123'
      }
      const socketConnection = await insertSocketConnection(socketConnectionInfo)
      // Make sure Socket Connection inserted correctly
      expect(socketConnection.accountId).to.equal(socketConnectionInfo.accountId)
      expect(socketConnection.socketId).to.equal(socketConnectionInfo.socketId)
      should.not.exist(socketConnection.endTime)
      // Fetch Active Socket Connections
      const activeSocketConnections = await getActiveAccountSocketConnections(accountId)
      const activeSocketConnectionsBad = await getActiveAccountSocketConnections(-1, 1)
      // Make sure Active Socket Connections were fetched correctly
      expect(activeSocketConnections[0].id).to.equal(socketConnection.id)
      expect(activeSocketConnections[0].accountId).to.equal(socketConnection.accountId)
      expect(activeSocketConnections[0].socketId).to.equal(socketConnection.socketId)
      should.not.exist(activeSocketConnections[0].endTime)
      should.not.exist(activeSocketConnectionsBad[0])
      // Fetch Recent Socket Connections
      const recentSocketConnections = await getRecentAccountSocketConnections(accountId, 1)
      const recentSocketConnectionsBad = await getRecentAccountSocketConnections(accountId, 0)
      // Make sure Recent Socket Connections were fetched correctly
      expect(recentSocketConnections[0].id).to.equal(socketConnection.id)
      expect(recentSocketConnections[0].accountId).to.equal(socketConnection.accountId)
      expect(recentSocketConnections[0].socketId).to.equal(socketConnection.socketId)
      should.not.exist(recentSocketConnections[0].endTime)
      should.not.exist(recentSocketConnectionsBad[0])
      // Update disconnected Socket Connection
      const disconnectedSocket = await updateSocketDisconnection(socketConnectionInfo)
      // Make sure disconnected Coket Connection was updated correctly
      expect(disconnectedSocket.accountId).to.equal(socketConnectionInfo.accountId)
      expect(disconnectedSocket.socketId).to.equal(socketConnectionInfo.socketId)
      should.exist(disconnectedSocket.endTime)
      // Fetch Active Socket Connections (disconnected)
      const activeDisconnectedSocketConnections = await getActiveAccountSocketConnections(accountId)
      // Make sure Active Socket Connections (disconnected) were fetched correctly
      should.not.exist(activeDisconnectedSocketConnections[0])
      // Fetch Recent Socket Connections (disconnected)
      const recentDisconnectedSocketConnections = await getRecentAccountSocketConnections(accountId, 1)
      // Make sure Recent Socket Connections were fetched correctly (disconnected)
      expect(recentDisconnectedSocketConnections[0].id).to.equal(socketConnection.id)
      expect(recentDisconnectedSocketConnections[0].accountId).to.equal(socketConnection.accountId)
      expect(recentDisconnectedSocketConnections[0].socketId).to.equal(socketConnection.socketId)
      should.exist(recentDisconnectedSocketConnections[0].endTime)
    })
  })

  describe('Broadcasts Tests', function() {
    it(`Should...
      - Get original accountId
      - Insert new broadcast Account
      - Insert online broadcast
      - Make sure online broadcast was inserted correctly
      - Fetch recent online broadcasts for account
      - Make sure recent online broadcasts for account were fetched correctly`, async function() {
      // Get original accountId
      const accountRow = await getAccountRow()
      const accountId = accountRow.id
      // Insert new broadcast Account
      const broadcastTestAccountUsername = 'broadcastTestAccount'
      await pgTransaction(`DELETE FROM accounts WHERE username = '${broadcastTestAccountUsername}'`)
      const broadcastTestAccountInfo = {
        username:broadcastTestAccountUsername,
        password:'broadcastTestAccountPassword',
      }
      const broadcastTestAccount = await insertAccount(broadcastTestAccountInfo)
      const broadcastAccountId = broadcastTestAccount.id
      // Insert online broadcast
      const broadcastInfo = {
        accountId: accountId,
        broadcastAccountId: broadcastAccountId,
      }
      const onlineBroadcast = await insertOnlineBroadcast(broadcastInfo)
      // Make sure online broadcast was inserted correctly
      expect(onlineBroadcast.accountId).to.equal(broadcastInfo.accountId)
      expect(onlineBroadcast.broadcastAccountId).to.equal(broadcastInfo.broadcastAccountId)
      // Fetch recent online broadcasts for account
      const goodLookupInfo = {
        accountId: accountId,
        lookbackHours: 24,
      }
      const badLookupInfo = {
        accountId: accountId,
        lookbackHours: 0,
      }
      const recentOnlineBroadcasts = await getRecentOnlineBroadcasts(goodLookupInfo)
      const recentOnlineBroadcastsBad = await getRecentOnlineBroadcasts(badLookupInfo)
      // Make sure recent online broadcasts for account were fetched correctly
      expect(recentOnlineBroadcasts.length).to.equal(1)
      expect(recentOnlineBroadcasts[0].id).to.equal(onlineBroadcast.id)
      expect(recentOnlineBroadcasts[0].accountId).to.equal(onlineBroadcast.accountId)
      expect(recentOnlineBroadcasts[0].broadcastAccountId).to.equal(onlineBroadcast.broadcastAccountId)
      should.not.exist(recentOnlineBroadcastsBad[0])
    })
  })
