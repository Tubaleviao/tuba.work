$(function(){
  
  var socket = io('/talking');
	
	$('body').on('mousedown', function(){
      console.log('mousedown')
	});
  
  socket.emit('event', {data: 'nothing'})
  
  socket.on('event', console.log)
  
});