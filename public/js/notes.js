$(function(){
  
  var socket = io('/notes');
  var x, y;
  /*$('#save').on('click', function(){
    socket.emit('save', {user: getUser(), note: $('#note1').val() });
  });*/
	
	$('#add').on('click', function(){
		var ta = $('<textarea/>').addClass('note');
		var id0 = $('.note').last().attr('id');
		if(id0){
      var id = Number(id0.substring(4, id0.length)); 
      for(var i=0; i<$("body textarea").length; i++){
        var note_id = $("textarea:eq("+i+")").attr("id");
        note_id = Number(note_id.substring(4, note_id.length));
        if( note_id >= id){
          id = note_id+1;
        }
      }
			console.log(id);
			ta.attr('id', 'note'+(id));
			$('.note').last().after(ta);
		}else{
			ta.attr('id', 'note1');
			$('#add').after(ta);
		}
	});
	
	$('.note').on('mousedown', function(){
		x = $(this).width();
		y = $(this).height();
	});
	
	$('.note').on('mouseup', function(){
		if(x != $(this).width() || y != $(this).height()){
			x = $(this).width();
			y = $(this).height();
			var id = $(this).attr('id');
			var id_n = Number(id.substring(4, id.length));
			console.log(+$(this).width()+" + "+$(this).height());
			socket.emit('saveSize', {user: getUser(), id: id_n, x: x, y: y });
		}
	});
	
	
	$(document).on('change', ".note", function(){
		var id = $(this).attr('id');
		var id_n = Number(id.substring(4, id.length));
		console.log(' '+id_n);
		socket.emit('save', {user: getUser(), note: $('#note'+id_n).val(), id: id_n });
	});
  
  socket.on('saved', function(saved){
    if(saved){
      $('.msg').text('Notes saved ~').show(200).delay(500).fadeOut(150);
    }else{
      $('.msg').text('ERROR OMG FUK').show(200).delay(500).fadeOut(150);
    }
  });
  
  socket.on('attBTC', function(data){
		if($("#brl").text() != data.brl){
			$("#brl").css('display', 'none').text(data.brl).fadeIn(130);
			$("#usd").css('display', 'none').text(data.usd).fadeIn(130);
		}
	});
  
});