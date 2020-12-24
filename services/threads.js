const { getAccountDetails } = require('../models/accounts')
const {
  insertTopic,
  insertThreadToStart,
  insertThreadInvitation,
} = require('../models/threads')

async function createThreadWithNewTopic(threadInfo){
  try {
    const topic = await insertTopic(threadInfo)
    threadInfo['topicId'] = topic.id
    const thread = await insertThreadToStart(threadInfo)
    threadInfo['id'] = thread.id
    return threadInfo
  } catch (error) {
    throw new Error(error)
  }
}

async function createThreadForkTopic(threadInfo){
  try {
    const thread = await insertThreadToStart(threadInfo)
    threadInfo['id'] = thread.id
    return threadInfo
  } catch (error) {
    throw new Error(error)
  }
}

async function sendEmailInviteToThread(info){
  try {
      const email = (info.inviteeAccountId) ? (await getAccountDetails(info.inviteeAccountId)).email : info.inviteeEmail
      // TO DO: Send email
      const invite = await insertThreadInvitation(info)
      return
  } catch (error) {
    throw new Error(error)
  }

}



module.exports = {
  createThreadWithNewTopic,
  createThreadForkTopic,
  sendEmailInviteToThread,
}
