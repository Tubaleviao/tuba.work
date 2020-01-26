
let musics

let selected = () => {
	let x = document.getElementById("upio_input");
	let txt3 = $("<div/>");
	let txt = "", total=0;
	if ('files' in x) {
		if (x.files.length === 0) {
			txt = "Select one or more files.";
		} else {
			for (let i = 0; i < x.files.length; i++) {
				let txt2 = $("<div/>");
				let file = x.files[i];
				if ('name' in file) {txt = file.name;}
				if ('size' in file) {
					total += (file.size / 1024 / 1024).toFixed(2);
					txt += " - " + (file.size / 1024 / 1024).toFixed(2) + " Mb";
				}
				txt2.text(txt);
				txt3.append(txt2);
			}
		}
	}
	if(Number(total)+Number(getSize()) >= 4048){
		alert("You have only "+Number(2048-getSize()).toFixed(2)+" Mb of free space, you are trying to upload "+total+" Mb\n"+
				 		"To get more space, you must to pay U$ 0,10 per Gb per Month.");
		$("#upio_input").val("");
	}else{
		$('#selected').empty();
		$('#selected').append(txt3.html());
	}
}

let addMusics = (musicsJs) => {
	musics = musicsJs;
	let $musics = $('.musics');
	musics.forEach((music) => {
		if(music.slice(-4) == '.mp3'){
			let $trash = $('<div>').addClass('trash');
			let $el = $('<div>').addClass('music').text(music);
			let $li = $('<li>').append($el,$trash);
			$musics.append($li);
		}
	});
}
	
let addMusic = (music) => {
	let $musics = $('.musics');
	if(music.slice(-4) == '.mp3'){
		let $trash = $('<div>').addClass('trash');
		let $el = $('<div>').addClass('music').text(music);
		let $li = $('<li>').append($el,$trash);
		$musics.prepend($li);
	}
}

let putOnQueue = (data) => {
	let music = $("<div/>").attr("id", "music"+data.id);
	if(!data.exists){
		music.text(data.music+" ("+data.size+" Mb) - "+data.loaded+" Mb");
		$("#upload-progress").append(music);
		$("#selected").children().first().remove();
	}else{
		music.text(data.music+" - alredy there!").show(200).delay(1000).fadeOut(150);
		$("#upload-progress").append(music);
		$("#selected").children().first().remove();
	}
}

let remove = id => (elem=document.getElementById(id)).parentNode.removeChild(elem)

$(document).ready(() => {
	
	let socket = io('/player');
	let uploader = new UpIoFileUpload(socket);
	let current = musics[Math.floor(Math.random()*musics.length)];
  let next = musics[Math.floor(Math.random()*musics.length)];
	let user = "users/"+getUser();
	let audioTag = $('#audio');
	let dom = document.getElementById("audio");
	
	dom.volume = 0.5;
	
  uploader.chunkSize = 1024 * 100;
	uploader.listenInput(document.getElementById("upio_input"));
	
	// SOCKET FUNCTIONS
	
	socket.emit('setUser', user);
	
	socket.on('attBTC', (data) => {
		if($("#brl").text() != data.brl){
			$("#brl").css('display', 'none').text(data.brl).fadeIn(130);
			$("#usd").css('display', 'none').text(data.usd).fadeIn(130);
		}
	});
	
	socket.on('addMusicProgress', (data) => {
		putOnQueue(data);
	});
	
	socket.on('up_progress', (data) => {
		let id = "#music"+data.file_id;
		$(id).text(data.file_name+" ("+(data.file_size/1024/1024).toFixed(2)+" Mb) - "+
               (data.loaded/1024/1024).toFixed(2)+" Mb"); 
	});
  
	socket.on('deleteMusicProgress', (data) => {
    if(data.success){
      musics.push(data.music); // Adds the new music to the music list
      addMusic(data.music);
      $("#music"+data.id).append(data.music+" - Completed!").show(200).delay(1000).fadeOut(150).remove();
    }else{
      let music = $("<div/>").attr("id", "music"+data.id);
      music.text($("#selected").children().first().text()+" - Aborted!").show(200).delay(1000).fadeOut(150);
      $("#upload-progress").append(music);
      $("#selected").children().first().remove();
    }
    
	});
	
	// PAGE USABILITY
	
	$(".seeker").drags(); //drags?
	$(".body").on("mouseup", () => {
		$(".seeker").removeClass('draggable');
		//dom.play();
	});
	
	$('.label').on('click', () => {
		document.getElementById("upio_input").click();
	});

	$('.checkbox').click((e) => {
		$(e.target).toggleClass('checked');
	});
	
	$(document).on('click', ".trash", (e) => {
		let music = $(e.target).closest('li').children('.music').text();
		socket.emit('delete', music);
		$(e.target).closest('li').attr('id', 'deleteThis');
		remove('deleteThis');
	});
		
	$('.trash').mouseover((e) => {
		$(e.target).closest('li').children('.music').css('text-decoration', 'underline');
	});
	$('.trash').mouseout((e) => {
		$(e.target).closest('li').children('.music').css('text-decoration', 'none');
	});
	
	jQuery.expr[':'].contains = (a, i, m) => { // sets contains to lowercase
		return jQuery(a).text().toLowerCase()
				.indexOf(m[3].toLowerCase()) >= 0;
	};

	$('.search').on('input', (e) => {
		$("li:not(:contains('"+e.target.value.toLowerCase()+"'))").hide(); //val().toLowerCase()
		$("li:contains('"+e.target.value.toLowerCase()+"')").show();
	});
	
	$("#vol").on('click', (e) => {
		if(e.target.className.includes('muted')){
			dom.muted = false;
			$("#vol").css("background", "transparent url('/img/player/vol.ico') no-repeat 0 50%");
			$("#vol").toggleClass('muted');
		}else{
			dom.muted = true;
			$("#vol").css("background", "transparent url('/img/player/no-vol.ico') no-repeat 0 50%");
			$("#vol").toggleClass('muted');
		}
	});
	
	$("#play").on('click', (e) => {
		if(e.target.className.includes('playing'))
			dom.pause();
		else
			dom.play();
	});
	
	dom.onvolumechange = () => {
		$("#vol-level").css('width', Math.round(dom.volume*50)+'px');
	}
	
	dom.onplay = () => {
    let icon = window.innerHeight > window.innerWidth ? `pause64.ico` : `pause.ico`
		$("#play").css("background", `transparent url('/img/player/${icon}') no-repeat 0 50%`);
		if(!$("#play").hasClass('playing')){
			$("#play").toggleClass('playing');
		}
	};
	
	dom.onpause = () => {
    let icon = window.innerHeight > window.innerWidth ? `play64.ico` : `play.ico`
		$("#play").css("background", `transparent url('/img/player/${icon}') no-repeat 0 50%`);
		$("#play").toggleClass('playing');
	};
	
	dom.ontimeupdate = () => {
		let coef = dom.duration/200;
		let px = dom.currentTime/coef;
		//var buf = dom.buffered.end(dom.buffered.length - 1)/coef;
		//var buf = dom.buffered.end(((dom.buffered.length > dom.duration) ? dom.buffered.length : 1) - 1)/coef;
		let buf;
		try {buf = dom.buffered.end(dom.buffered.length - 1)/coef;} 
		catch (err) {buf = 0;}
		$("#progress-value").css('width', Math.round(px)+'px');
		$("#progress-buffer").css('width', Math.round(buf)+'px');
	};

	$(document).on('click', ".music", (e) => {
		audioTag.attr('src', user+'/'+e.currentTarget.textContent);
		$('#np').text(e.currentTarget.textContent);
	});

	audioTag.on('ended',() => {
	    if($('.repeat').hasClass('checked')){
	    	audioTag.currentTime = 0;
	    } else if($('.random').hasClass('checked')){
	    	audioTag.attr('src', user+'/'+next);
	    	$('#np').text(next);
        next = musics[Math.floor(Math.random()*musics.length)];
        $('body').append($('<link>').attr('rel','prefetch').attr('href', user+'/'+next))
		}
	});

	$('#next').click(() => {
    audioTag.attr('src', user+'/'+next);
    $('#np').text(next);
    next = musics[Math.floor(Math.random()*musics.length)];
    $('body').append($('<link>').attr('rel','prefetch').attr('href', user+'/'+next))
	});

	audioTag.attr('src', user+'/'+current);
	$('#np').text(current);
  $('body').append($('<link>').attr('rel','prefetch').attr('href', user+'/'+next))
});

// drag code


