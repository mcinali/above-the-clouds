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

// Create Stream
async function createStream(streamInfo){
  try {
    const results = insertStream(streamInfo)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createStream,
}
