const { insertTopic } = require('../models/topics')

// Create Topic
async function createTopic(topicInfo){
  try {
    const results = await insertTopic(topicInfo)
    return {
      'topicId':results.id,
      'accountId':results.accountId,
      'topic':results.topic,
      'createdAt':results.createdAt,
    }
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createTopic,
}
