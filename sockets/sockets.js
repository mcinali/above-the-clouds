function establishSockets(io){
  try {
    io.on('connection', (socket) => {
      console.log('User connected')
      console.log(socket.request._query)
      socket.on('disconnect', () => {
        console.log('User disconnected')
      })
    })
  } catch (error) {

  }
}

module.exports = {
  establishSockets,
}
