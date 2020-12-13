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

async function getThreads(userId){
  try {
    const threads = await selectThreadsForUser(userId)
    const promises = threads.map(async function(x) {x['participants'] = await selectThreadParticipants(x.id); return x})
    const results = await Promise.all(promises)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

// async function forkThread(threadInfo){
//   try {
//
//   } catch (error) {
//     throw new Error(error)
//   }
// }
//
// async function createNewThread(threadInfo){
//   try {
//
//   } catch (error) {
//     throw new Error(error)
//   }
// }

module.exports = {
  getThreads,
}
