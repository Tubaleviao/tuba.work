function appear(){
	$('.fmpy').toggle();
	$('.norepeat').toggle();
}

function att_prev(){
	var month_end, year_end;
	year_end = Number($("#rep_years").val())+ Number($("#starty").val());
	month_end = Number($("#startm").val())-1+Number($('#rep_months').val());
	if(month_end <= 12){
		year_end -= 1;
	}else{
		month_end -= 12;
	}
	$('#prev').text(' '+month_end+'/'+year_end);
}

function loadHistory(data){
	var ins=0, outs=0;
	data.moves.forEach((move) => {
		if(move.repeat == "1"){
			if(move.in == "1"){
				ins += Number(move.value);
			}else{
				outs -= Number(move.value);
			}
		}else{
			if(move.in == "1"){
				ins += Number(move.value);
			}else{
				outs -= Number(move.value);
			}
		}
	});
}

function load_six_months(data){
	var current = new Date();
	var form = $('<form/>').attr('action', 'one').attr('id', 'one_form');
	$('#lookup').empty();
  var accumulated = 0;
	for(var i = -1; i<5; i++){
		var out, inp, total;
		var monthBox, ins=0, outs=0;
		var thisMonth, thisYear;
		if(Number(current.getMonth())+i < 0){ // First month of the year
			thisMonth = 13+i;
			thisYear = current.getFullYear()-1;
		}else{
			thisMonth = Number(current.getMonth())+1+i;
			thisYear = current.getFullYear();
		}

		data.moves.forEach((move) => {
			if(move.repeat == "1"){	/* \/ First of the year */
				if(thisMonth+((thisYear-move.starty)*12) >= move.startm && thisMonth < Number(move.startm)+Number(move.months)){
					if(thisYear >= move.starty && thisYear <= move.years+move.starty){
						if(move.in == "1"){
							ins += Number(move.value);
						}else{
							outs -= Number(move.value);
						}
					}
				}
			}else{
				if(Number(move.month)+12 == thisMonth && thisYear+1 == move.year){
					if(move.in == "1"){
						ins += Number(move.value);
					}else{
						outs -= Number(move.value);
					}
				}else if(move.month == thisMonth && thisYear == move.year){
					if(move.in == "1"){
						ins += Number(move.value);
					}else{
						outs -= Number(move.value);
					}
				}
			}
		});

		if(thisMonth <= 12){
			monthBox = $('<div/>').attr('id', thisMonth+''+thisYear).addClass('month');
		}else{
			monthBox = $('<div/>').attr('id', thisMonth-12+''+Number(thisYear+1)).addClass('month');
		}
		var id = monthBox.attr('id');
		monthBox.append(id.substring(0, id.length-4)+'/'+
			id.substring(id.length-4, id.length));

		inp = $('<p/>').addClass('inputs').append('Inputs: '+ins);
		out = $('<p/>').addClass('outputs').append('Outputs: '+outs);		
		total = $('<p/>').addClass('total').append('Resting: '+Number(ins+outs+accumulated));
		monthBox.append(inp, out, total);
		$('#lookup').append(monthBox);
    accumulated += Number(ins+outs);
		//$('#data').append(inp, out, total);
	}
}

function load_one_month(all, id){
	var month = Number(id.substring(0, id.length-4));
	var year = Number(id.substring(id.length-4, id.length));
	var list = $('<ul/>').attr('id', 'oneMonth').append("<h2>"+month+"/"+year+"</h2>");
	var form = $('<form/>').attr('action', 'six');
	var next = $('<input/>').attr('id', 'next').attr('value', 'Next Months').attr('type', 'submit');
	var name, value, outs=0, ins=0;

	$('input[name="page"]').val(id);

	all.moves.forEach((move) => {
		var li = $('<li/>').addClass('move').attr('id', move._id);
		if(move.repeat == "1"){
			var ty = Number(move.years)+Number(move.starty);
			if(year >= move.starty && year <= ty){
				var tm = Number(move.startm)+Number(move.months);
				var tmy = month+(year*12);
				var tsmy = Number(move.startm)+(Number(move.starty)*12);
				if(tmy >= tsmy && month < tm){
					name = $('<div/>').addClass('noma').append(move.name);
					if(move.in == "1"){
						value = $('<div/>').addClass('mona').append(move.value);
						ins += Number(move.value);
					}else{
						value = $('<div/>').addClass('mona').append("-"+move.value);
						outs -= Number(move.value);
					}
					li.append(name, value);
					list.append(li);
				}
			}
		}else{
			if(move.month == month && year == move.year){
				name = $('<div/>').addClass('noma').append(move.name);
				if(move.in == "1"){
					value = $('<div/>').addClass('mona').append(move.value);
					ins += Number(move.value);
				}else{
					value = $('<div/>').addClass('mona').append("-"+move.value);
					outs -= Number(move.value);
				}
				li.append(name, value);
				list.append(li);
			}
		}
	});
	$('#lookup').empty();
	var li = $('<li/>');
	name = $('<div/>').addClass('noma').append("Total");
	value = $('<div/>').addClass('mona').append(ins+outs);
	li.append(name, value);
	list.append(li);
	form.append(next);
	$('#lookup').append(list, form);
}

$(function(){

	var socket = io('/money');
	var today = new Date();
	var all;
  console.log("yoooooo")
	
	$('.inp_month').val(today.getMonth()+1); //inp_year
	$('.inp_year').val(today.getFullYear());

	att_prev();

	socket.emit('getMovements', {user: getUser()});
	socket.emit('oldMoves', {user: getUser()});

	$(document).on('click', ".month", function(){
		$('input[name="page"]').val($(this).attr('id'));			// MAKE A REQUEST TO CHANGE THE SESSION VARIABLE,
		$("form:first").attr('action', 'save');
		$("form:first").submit();									// PASS TROUGH EJS IN THE INPUT AND LOAD HERE
	});
	
	$(document).on('click', ".old", function(){
		$('input[name="page"]').val($(this).attr('id').replace("/", ""));
		$("form:first").attr('action', 'save');
		$("form:first").submit();
	});
	
	$(document).on('click', ".move", function(){
		var mo = $(this).attr('id');
		var result = {};
		for (var i = 0, len = all.moves.length; i < len; i++) {
			if(all.moves[i]._id == mo){
				result = all.moves[i];
			}
		}
		$('#form').show();
		if (result._id) {
			$('input[name="_id"]').val(result._id);
			$('input[name="name"]').val(result.name);
			if(result.in == "1"){
				$('.in').click();
			}else{
				$('.out').click();
			}
			$('input[name="value"]').val(result.value);
			if(result.repeat == "0"){
				$('select[name="repeat"]').val("0");
				$('select[name="month"]').val(result.month);
				$('input[name="year"]').val(result.year);
				if($('.norepeat').css('display')=="none"){
					appear();
				}
			}else{
				$('select[name="repeat"]').val("1");
				$('input[name="months"]').val(result.months);
				$('input[name="years"]').val(result.years);
				$('select[name="startm"]').val(result.startm);
				$('input[name="starty"]').val(result.starty);
				att_prev();
				if($('.fmpy').css('display')=="none"){
					appear();
				}
			}
		}
	});

	$('#add').click(function(){
		$('#form').toggle();
		$('input').first().focus();
		
		if($("#oneMonth").length !== 0){
			var text = $("#oneMonth").children("h2").text();
			var month = text.substring(0, text.length-5);
			var year = text.substring(text.length-4, text.length);
			$('select[name="month"]').val(month);
			$('input[name="year"]').val(Number(year));
		}
	});
	
	socket.on('oldMoves', function(data){
		var firstRpMove, rpMoves = data.rpMoves, nrpMoves = data.nrpMoves, done = new Array();
		var current = new Date();
		var thisMonth = Number(current.getMonth());
		var thisYear = current.getFullYear();
		
		rpMoves.forEach((move) => {
			var currentYear = Number(move.starty);
			while(currentYear <= thisYear){
				if(currentYear == thisYear){
					for(var j = Number(move.startm); j<=Number(move.months) && j<=thisMonth; j++){
						if(done[j+"/"+currentYear] === undefined) done[j+"/"+currentYear] = 0;
						if(move.in == "1"){done[j+"/"+currentYear] += Number(move.value)}
						else{done[j+"/"+currentYear] -= Number(move.value)}
					}
				}else{
					for(var j=Number(move.startm); j<=Number(move.months); j++){
						if(done[j+"/"+currentYear] === undefined) done[j+"/"+currentYear] = 0;
						if(move.in == "1"){done[j+"/"+currentYear] += Number(move.value)}
						else{done[j+"/"+currentYear] -= Number(move.value)}
					}
				}
				currentYear++;
			}
		});
		
		nrpMoves.forEach((move) => {
			var currentYear = Number(move.year);
			if(currentYear <= thisYear){
				if(currentYear == thisYear){
					if(Number(move.month) <= thisMonth){
						if(done[move.month+"/"+currentYear] === undefined) done[move.month+"/"+currentYear] = 0;
						if(move.in == "1"){done[move.month+"/"+currentYear] += Number(move.value)}
						else{done[move.month+"/"+currentYear] -= Number(move.value)}
					}
				}else{
					if(done[move.month+"/"+currentYear] === undefined) done[move.month+"/"+currentYear] = 0;
					if(move.in == "1"){done[move.month+"/"+currentYear] += Number(move.value)}
					else{done[move.month+"/"+currentYear] -= Number(move.value)}
				}
			}
		});
		
		for(var y in done){
			var li = $('<li/>').addClass('old').attr('id', y);
			var name = $('<div/>').addClass('noma').append(y);
			var value = $('<div/>').addClass('mona').append(done[y]);
			li.append(name, value);
			$('#months').append(li);
		}
	});
	
	$('#save').click(function(){
		var data = {};
		//$("form:first").attr('action', 'save');
		data._id = $('input[name="_id"]').val();
		data.name = $('input[name="name"]').val();
		data.in = $('input[name="in"]').val();
		data.value = $('input[name="value"]').val();
		data.repeat = $('select[name="repeat"]').val();
		data.months = $('input[name="months"]').val();
		data.month = $('select[name="month"]').val();
		data.year = $('input[name="year"]').val();
		data.years = $('input[name="years"]').val();
		data.page = $('input[name="page"]').val();
		data.starty = $('input[name="starty"]').val();
		data.startm = $('select[name="startm"]').val();
		data.user = getUser();
		if(data.repeat == "1"){
			appear();
		}
		socket.emit('saveMove', data);
	});
	$('#delete').click(function(){
		var data = {};
		data.id = $('input[name="_id"]').val();
		socket.emit('deleteMove', data);
	});

	$(document).on('click', "#next", function(){
		$('input[name="page"]').val('');
	});

	$('.in').on('click', function(){
		if($(this).hasClass('unchecked')){
			if($('.out').hasClass('checked')){
				$('.out').css('background-image', 'url("img/unchecked.png")');
				$('.out').removeClass('checked');
				$('.out').addClass('unchecked');
			}
			$(this).css('background-image', 'url("img/checked.png")');
			$(this).removeClass('unchecked');
			$(this).addClass('checked');
			$('#in').attr('value', '1');
		}
	});
	$('.out').on('click', function(){
		if($(this).hasClass('unchecked')){
			if($('.in').hasClass('checked')){
				$('.in').css('background-image', 'url("img/unchecked.png")');
				$('.in').removeClass('checked');
				$('.in').addClass('unchecked');
				$('#in').attr('value', '0');
			}
			$(this).css('background-image', 'url("img/checked.png")');
			$(this).removeClass('unchecked');
			$(this).addClass('checked');
		}
	});
	
	socket.on('moveSaved', function(data){
		if($("#oneMonth").length !== 0){
			var name, value;
			var li = $('<li/>').addClass('move').attr('id', data.id);
			if(data.id){
				name = $('<div/>').addClass('noma').append(data.name);
				if(data.in == "1"){
					value = $('<div/>').addClass('mona').append(data.value);
				}else{
					value = $('<div/>').addClass('mona').append("-"+data.value);
				}
				li.append(name, value);
				$("#"+$(".move").last().attr('id')).after(li);
			}else{
				if(data.in == "1"){
					$("#"+data._id).children(".noma").text(data.name);
					$("#"+data._id).children(".mona").text(data.value);
				}else{
					$("#"+data._id).children(".noma").text(data.name);
					$("#"+data._id).children(".mona").text("-"+data.value);
				}
			}
		}
		//$("form:first").trigger('reset');
		//$("#oneMonth li").last().css("background-color", "yellow");
		$("form:first")[0].reset();
		var d = new Date();
		var month = d.getMonth()+1;
		var year = d.getFullYear();
		$('select[name="month"]').val(month);
		$('input[name="year"]').val(Number(year));
    $('input[name="starty"]').val(Number(year));
		$('select[name="startm"]').val(month);
	});
	
	socket.on('moveDeleted', function(data){
		$("#"+data.id).remove();
		$("form:first").trigger('reset');
    var d = new Date();
		var month = d.getMonth()+1;
		var year = d.getFullYear();
		$('select[name="month"]').val(month);
		$('input[name="year"]').val(Number(year));
    $('input[name="starty"]').val(Number(year));
		$('select[name="startm"]').val(month);
	});

	socket.on('getMovements', function(data){
		var value = $('input[name="page"]').val();
		all = data;
		if(value===""){
			load_six_months(data);
		}else{
			load_one_month(data, value);
		}
	});

});