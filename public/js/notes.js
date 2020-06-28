$(function(){
  
  var socket = io('/notes');
  var x, y;
  /*$('#save').on('click', function(){
    socket.emit('save', {user: getUser(), note: $('#note1').val() });
  });*/
  
	$('#add').on('click', function(){
		let ta = $('<textarea/>').addClass('note');
		let id0 = $('.note').last().attr('id');
		if(id0){
      let id = Number($('.note').length);
      for(let i=0; i<$("body textarea").length; i++){
        let note_id = $("textarea:eq("+i+")").attr("id");
        note_id = Number(note_id);
        if( note_id >= id){
          id = note_id+1;
        }
      }
      console.log(id);
			ta.attr('id', id);
			$('.note').last().after(ta);
		}else{
			ta.attr('id', '1');
			$('#add').after(ta);
		}
	});
	
	$(document).on('mousedown', ".note", function(){
		x = $(this).width();
		y = $(this).height();
	});
	
	$(document).on('mouseup', ".note", function(){
		if(x != $(this).width() || y != $(this).height()){
			x = $(this).width();
			y = $(this).height();
			var id = $(this).attr('id');
			var id_n = Number(id ); // id.substring(4, id.length)
			//console.log(getUser(),$(this).width()+" + "+$(this).height(), " id: "+id_n);
			socket.emit('saveSize', {user: getUser(), id: id_n, x: x, y: y });
		}
	});
	
	
	$(document).on('change', ".note", function(){
		let id = $(this).attr('id');
    let values = {user: getUser(), note: id ? $('#'+id).val() : "", id: id!="" ? Number(id) : null}
    //console.log(values, " id: "+id);
		socket.emit(values.note == '' ? 'delete' : 'save', values);
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