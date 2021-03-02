function establishSockets(io){
  try {
    io.on('connection', (socket) => {
      console.log()
      console.log('User connected')
      console.log(socket.id)
      console.log(socket.request._query)
      socket.on('disconnect', () => {
        console.log()
        console.log('User disconnected')
        console.log(socket.id)
        console.log(socket.request._query)
      })
    })
  } catch (error) {

  }
}

module.exports = {
  establishSockets,
}
