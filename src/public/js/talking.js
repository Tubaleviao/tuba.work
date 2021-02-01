$(function(){
  let mediaRecorder;
  var socket = io('/talking');
	
	$('body').on('mousedown', function(){
    console.log('mousedown')
    mediaRecorder.stop()
	});
  
  $('body').on('keydown', function(e){
    if(e.keyCode == 32){
      mediaRecorder.start(250)
    }
	});
  
  socket.on('talk', data => {
    console.log(data)
  })
  
  if (navigator.mediaDevices) {
    console.log('getUserMedia supported.');
    navigator.mediaDevices.getUserMedia({audio: true}).then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      mediaRecorder.ondataavailable = e => socket.emit('talk', e.data)
      //mediaRecorder.onstop = e => {console.log('stopped')}
    })
  }
  // mediaSource = new MediaSource();
  // audio.src = URL.createObjectURL(mediaSource);
  
  //var leftVideo = document.getElementById('leftVideo');
  //var rightVideo = document.getElementById('rightVideo');
  //leftVideo.onplay = function() {
    //var stream = leftVideo.captureStream();
    //rightVideo.srcObject = stream;
  //};
  
});