const Joi = require('joi')
const {
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountIdFromPhone,
} = require('../models/accounts')

const {
  verifyEmailAccessToken,
  verifyPhoneAccessToken,
} = require('../models/preregistration')
const {
  checkInvitationCode,
  checkInvitationCodeConversion,
} = require('../models/invitations')

const accountFormFields = {
  firstname: Joi.string()
              .pattern(new RegExp('^[a-zA-z -]+$'))
              .required()
              .messages({
                'string.pattern.base':'firstname must only container letters, spaces, and \'-\'',
                'any.required':'firstname is a required field',
              }),
  lastname: Joi.string()
             .pattern(new RegExp('^[a-zA-z -]+$'))
             .required()
             .messages({
               'string.pattern.base':'lastname must only container letters, spaces, and \'-\'',
               'any.required':'lastname is a required field',
             }),
  username: Joi.string()
             .alphanum()
             .max(24)
             .required()
             .messages({
               'string.alphanum': 'username can only contain letters and numbers',
               'string.max':'username can have max 24 characters',
               'any.required':'username is a required field',
             }),
  email: Joi.string()
           .email()
           .required()
           .messages({
             'string.email':'\'email\' must be a valid email',
             'any.required':'email is a required field',
           }),
  password: Joi.string()
             .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,32}$'))
             .required()
             .messages({
               'string.pattern.base': 'password must be between 8-32 characters and must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
               'any.required':'password is a required field',
             }),
  phone: Joi.number()
           .integer()
           .min(201000000)
           .max(9899999999)
           .required()
           .messages({
             'number.base':'phone number must be a valid (10-digit) US phone number',
             'number.min': 'phone number must be a valid (10-digit) US phone number',
             'number.max': 'phone number must be a valid (10-digit) US phone number',
             'any.required':'phone number is a required field',
           }),
  emailAccessToken: Joi.string()
                     .required()
                     .messages({
                       'any.required':'email access token is a required field',
                     }),
  phoneAccessToken: Joi.string()
                     .required()
                     .messages({
                       'any.required':'phone access token is a required field',
                     }),
}

// Registration middleware validation
function validateAccountSchema(req, res, next){
  try {
    const accountSchema = Joi.object(accountFormFields)
    const validation = accountSchema.validate(req.body)
    if (validation.error){
      const errorMessages = validation.error.details.map(item => item.message)
      res.status(400).json({error: errorMessages})
    } else {
      next()
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function validateUniqueAccountFields(req, res, next){
  try {
    const { username, email, phone } = req.body
    const usernameAccountId = await getAccountIdFromUsername(username)
    if (Boolean(usernameAccountId)) {
      return res.status(400).json({error: ['An account with this username already exists']})
    }
    const emailAccountId = await getAccountIdFromEmail(email)
    if (Boolean(emailAccountId)) {
      return res.status(400).json({error: ['An account with this email already exists']})
    }
    const phoneAccountId = await getAccountIdFromPhone(phone)
    if (Boolean(phoneAccountId)) {
      return res.status(400).json({error: ['An account with this phone number already exists']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

async function validateRegistrationAccessTokens(req, res, next){
  try {
    const { email, emailAccessToken, phone, phoneAccessToken } = req.body
    const emailAccessTokenInfo = {
      email: email,
      accessToken: emailAccessToken,
    }
    const emailAccessTokenRow = await verifyEmailAccessToken(emailAccessTokenInfo)
    if (emailAccessTokenRow.length==0){
      return res.status(400).json({error: ['Invalid email access token']})
    } else if (emailAccessTokenRow[0].expired) {
      return res.status(400).json({error: ['Expired email access token']})
    }
    const phoneAccessTokenInfo = {
      phone: phone,
      accessToken: phoneAccessToken,
    }
    const phoneAccessTokenRow = await verifyPhoneAccessToken(phoneAccessTokenInfo)
    if (phoneAccessTokenRow.length==0){
      return res.status(400).json({error: ['Invalid phone access token']})
    } else if (phoneAccessTokenRow[0].expired) {
      return res.status(400).json({error: ['Expired phone access token']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

// Pre-Registration middleware validation
function validatePreRegistrationAccountSchema(req, res, next){
  try {
    const formFields = (({firstname, lastname, username, email, password}) => ({firstname, lastname, username, email, password}))(accountFormFields)
    const accountSchema = Joi.object(formFields)
    const validation = accountSchema.validate(req.body)
    if (validation.error){
      const errorMessages = validation.error.details.map(item => item.message)
      res.status(400).json({error: errorMessages})
    } else {
      next()
    }
  } catch (error) {
    throw new Error(error)
  }
}

function validatePhoneNumberSchema(req, res, next){
  try {
    const formFields = (({phone}) => ({phone}))(accountFormFields)
    const accountSchema = Joi.object(formFields)
    const validation = accountSchema.validate(req.body)
    if (validation.error){
      const errorMessages = validation.error.details.map(item => item.message)
      res.status(400).json({error: errorMessages})
    } else {
      next()
    }
  } catch (error) {
    throw new Error(error)
  }
}

function validateAccessCodeSchema(req, res, next){
  try {
    const formFields = {
      accessCode: Joi.number()
                   .integer()
                   .min(0)
                   .max(999999)
                   .required()
                   .messages({
                     'number.base':'access code must be a 6-digit integer',
                     'number.min': 'access code must be a 6-digit integer',
                     'number.max': 'access code must be a 6-digit integer',
                     'any.required':'access code is a required field',
                   }),
       email: Joi.string()
                .email()
                .messages({
                  'string.email':'\'email\' must be a valid email',
                }),
       phone: Joi.number()
                .integer()
                .min(201000000)
                .max(9899999999)
                .messages({
                  'number.base':'phone number must be a valid (10-digit) US phone number',
                  'number.min': 'phone number must be a valid (10-digit) US phone number',
                  'number.max': 'phone number must be a valid (10-digit) US phone number',
                })
    }
    const accountSchema = Joi.object(formFields)
    const validation = accountSchema.validate(req.body)
    if (validation.error){
      const errorMessages = validation.error.details.map(item => item.message)
      res.status(400).json({error: errorMessages})
    } else {
      next()
    }
  } catch (error) {
    throw new Error(error)
  }
}

async function validateUniquePreRegistrationAccountFields(req, res, next){
  try {
    const { username, email } = req.body
    const usernameAccountId = await getAccountIdFromUsername(username)
    if (Boolean(usernameAccountId)) {
      return res.status(400).json({error: ['An account with this username already exists']})
    }
    const emailAccountId = await getAccountIdFromEmail(email)
    if (Boolean(emailAccountId)) {
      return res.status(400).json({error: ['An account with this email already exists']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

async function validateUniquePhoneNumber(req, res, next){
  try{
    const { phone } = req.body
    const phoneAccountId = await getAccountIdFromPhone(phone)
    if (Boolean(phoneAccountId)) {
      return res.status(400).json({error: ['An account with this phone number already exists']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

async function validateInvitationCode(req, res, next){
  try {
    const { code } = req.query
    if (!Boolean(code)){
      return res.status(401).json({error: ['Invitation code required']})
    }
    const invitationCodeIdRow = await checkInvitationCode(code)
    if(!Boolean(invitationCodeIdRow[0])){
      return res.status(401).json({error: ['Valid invitation code required']})
    }
    const invitationCodeId = invitationCodeIdRow[0]
    const invtitationCodeConversionRow = await checkInvitationCodeConversion(invitationCodeId)
    if(Boolean(invtitationCodeConversionRow[0])){
      return res.status(401).json({error: ['Invitation code is no longer valid']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  validateAccountSchema,
  validateUniqueAccountFields,
  validateRegistrationAccessTokens,
  validatePreRegistrationAccountSchema,
  validatePhoneNumberSchema,
  validateAccessCodeSchema,
  validateUniquePreRegistrationAccountFields,
  validateUniquePhoneNumber,
  validateInvitationCode,
}
