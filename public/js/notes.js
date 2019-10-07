$(() => {
    const socket = io('/notes');
    let x;
    let y;
    /*$('#save').on('click', function(){
      socket.emit('save', {user: getUser(), note: $('#note1').val() });
    });*/

    $('#add').on('click', () => {
		const ta = $('<textarea/>').addClass('note');
		const id0 = $('.note').last().attr('id');
		if(id0){
      let id = Number(id0.substring(4, id0.length)); 
      for(let i=0; i<$("body textarea").length; i++){
        let note_id = $(`textarea:eq(${i})`).attr("id");
        note_id = Number(note_id.substring(4, note_id.length));
        if( note_id >= id){
          id = note_id+1;
        }
      }
			console.log(id);
			ta.attr('id', `note${id}`);
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
			const id = $(this).attr('id');
			const id_n = Number(id.substring(4, id.length));
			console.log(`${+$(this).width()} + ${$(this).height()}`);
			socket.emit('saveSize', {user: getUser(), id: id_n, x, y });
		}
	});


    $(document).on('change', ".note", function(){
		const id = $(this).attr('id');
		const id_n = Number(id.substring(4, id.length));
		console.log(` ${id_n}`);
		socket.emit('save', {user: getUser(), note: $(`#note${id_n}`).val(), id: id_n });
	});

    socket.on('saved', saved => {
      if(saved){
        $('.msg').text('Notes saved ~').show(200).delay(500).fadeOut(150);
      }else{
        $('.msg').text('ERROR OMG FUK').show(200).delay(500).fadeOut(150);
      }
    });

    socket.on('attBTC', ({brl, usd}) => {
          if($("#brl").text() != brl){
              $("#brl").css('display', 'none').text(brl).fadeIn(130);
              $("#usd").css('display', 'none').text(usd).fadeIn(130);
          }
      });
});