const { insertTopic } = require('../models/topics')

// Create Topic
async function createTopic(topicInfo){
  try {
    const results = insertTopic(topicInfo)
    return results
  } catch (error) {
    throw new Error(error)
  }
}

module.exports = {
  createTopic,
}
