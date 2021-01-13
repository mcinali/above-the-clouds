const Joi = require('joi')
const {
  getAccountIdFromUsername,
  getAccountIdFromEmail,
  getAccountIdFromPhone,
} = require('../models/accounts')

function validateAccountSchema(req, res, next){
  try {
    const accountSchema = Joi.object({
      username: Joi.string()
                   .alphanum()
                   .max(24)
                   .required()
                   .messages({
                     'string.alphanum': 'username can only contain letters and numbers',
                     'string.max':'username can have max 24 characters',
                     'any.required':'username is a required field',
                   }),

      password: Joi.string()
                   .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,32}$'))
                   .required()
                   .messages({
                     'string.pattern.base': 'password must be between 8-32 characters and must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
                     'any.required':'password is a required field',
                   }),

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

      email: Joi.string()
                .email()
                .required()
                .messages({
                  'string.email':'\'email\' must be a valid email',
                  'any.required':'email is a required field',
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
                })
    })
    const validation = accountSchema.validate(req.body)
    if (validation.error){
      const errorMessages = validation.error.details.map(item => item.message)
      res.status(400).json({errors: errorMessages})
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
      return res.status(400).json({errors: ['An account with this username already exists']})
    }
    const emailAccountId = await getAccountIdFromEmail(email)
    if (Boolean(emailAccountId)) {
      return res.status(400).json({errors: ['An account with this email already exists']})
    }
    const phoneAccountId = await getAccountIdFromPhone(phone)
    if (Boolean(phoneAccountId)) {
      return res.status(400).json({errors: ['An account with this phone number already exists']})
    }
    return next()
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  validateAccountSchema,
  validateUniqueAccountFields,
}
