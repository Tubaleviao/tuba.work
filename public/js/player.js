
let musics

let selected = () => {
    let x = document.getElementById("upio_input");
    let txt3 = $("<div/>");
    let txt = "";
    let total=0;
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
					txt += ` - ${(file.size / 1024 / 1024).toFixed(2)} Mb`;
				}
				txt2.text(txt);
				txt3.append(txt2);
			}
		}
	}
    if(Number(total)+Number(getSize()) >= 4048){
		alert(`You have only ${Number(2048-getSize()).toFixed(2)} Mb of free space, you are trying to upload ${total} Mb\nTo get more space, you must to pay U$ 0,10 per Gb per Month.`);
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
	let music = $("<div/>").attr("id", `music${data.id}`);
	if(!data.exists){
		music.text(`${data.music} (${data.size} Mb) - ${data.loaded} Mb`);
		$("#upload-progress").append(music);
		$("#selected").children().first().remove();
	}else{
		music.text(`${data.music} - alredy there!`).show(200).delay(1000).fadeOut(150);
		$("#upload-progress").append(music);
		$("#selected").children().first().remove();
	}
}

let remove = id => (elem=document.getElementById(id)).parentNode.removeChild(elem)

$(document).ready(() => {
	
	let socket = io('/player');
	let uploader = new UpIoFileUpload(socket);
	let next = musics[Math.floor(Math.random()*musics.length)];
	let user = `users/${getUser()}`;
	let audioTag = $('#audio');
	let dom = document.getElementById("audio");
	
	dom.volume = 0.5;
	
  uploader.chunkSize = 1024 * 100;
	uploader.listenInput(document.getElementById("upio_input"));
	
	// SOCKET FUNCTIONS
	
	socket.emit('setUser', user);
	
	socket.on('attBTC', ({brl, usd}) => {
		if($("#brl").text() != brl){
			$("#brl").css('display', 'none').text(brl).fadeIn(130);
			$("#usd").css('display', 'none').text(usd).fadeIn(130);
		}
	});
	
	socket.on('addMusicProgress', (data) => {
		putOnQueue(data);
	});
	
	socket.on('up_progress', ({file_id, file_name, file_size, loaded}) => {
		let id = `#music${file_id}`;
		$(id).text(`${file_name} (${(file_size/1024/1024).toFixed(2)} Mb) - ${(loaded/1024/1024).toFixed(2)} Mb`); 
	});
  
	socket.on('deleteMusicProgress', ({success, music, id}) => {
    if(success){
      musics.push(music); // Adds the new music to the music list
      addMusic(music);
      $(`#music${id}`).append(`${music} - Completed!`).show(200).delay(1000).fadeOut(150).remove();
    }else{
      let music = $("<div/>").attr("id", `music${id}`);
      music.text(`${$("#selected").children().first().text()} - Aborted!`).show(200).delay(1000).fadeOut(150);
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

	$('.checkbox').click(({target}) => {
		$(target).toggleClass('checked');
	});
	
	$(document).on('click', ".trash", ({target}) => {
		let music = $(target).closest('li').children('.music').text();
		socket.emit('delete', music);
		$(target).closest('li').attr('id', 'deleteThis');
		remove('deleteThis');
	});
		
	$('.trash').mouseover(({target}) => {
		$(target).closest('li').children('.music').css('text-decoration', 'underline');
	});
	$('.trash').mouseout(({target}) => {
		$(target).closest('li').children('.music').css('text-decoration', 'none');
	});
	
	jQuery.expr[':'].contains = (a, i, m) => jQuery(a).text().toLowerCase().includes(m[3].toLowerCase());

	$('.search').on('input', ({target}) => {
		$(`li:not(:contains('${target.value.toLowerCase()}'))`).hide(); //val().toLowerCase()
		$(`li:contains('${target.value.toLowerCase()}')`).show();
	});
	
	$("#vol").on('click', ({target}) => {
		if(target.className.includes('muted')){
			dom.muted = false;
			$("#vol").css("background", "transparent url('/img/player/vol.ico') no-repeat 0 50%");
			$("#vol").toggleClass('muted');
		}else{
			dom.muted = true;
			$("#vol").css("background", "transparent url('/img/player/no-vol.ico') no-repeat 0 50%");
			$("#vol").toggleClass('muted');
		}
	});
	
	$("#play").on('click', ({target}) => {
		if(target.className.includes('playing'))
			dom.pause();
		else
			dom.play();
	});
	
	dom.onvolumechange = () => {
		$("#vol-level").css('width', `${Math.round(dom.volume*50)}px`);
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
		$("#progress-value").css('width', `${Math.round(px)}px`);
		$("#progress-buffer").css('width', `${Math.round(buf)}px`);
	};

	$(document).on('click', ".music", ({currentTarget}) => {
		audioTag.attr('src', `${user}/${currentTarget.textContent}`);
		$('#np').text(currentTarget.textContent);
	});

	audioTag.on('ended',() => {
	    if($('.repeat').hasClass('checked')){
	    	audioTag.currentTime = 0;
	    } else if($('.random').hasClass('checked')){
	    	next = musics[Math.floor(Math.random()*musics.length)];
	    	audioTag.attr('src', `${user}/${next}`);
	    	$('#np').text(next);
		}
	});

	$('#next').click(() => {
		next = musics[Math.floor(Math.random()*musics.length)];
    	audioTag.attr('src', `${user}/${next}`);
    	$('#np').text(next);
	});

	audioTag.attr('src', `${user}/${next}`);
	$('#np').text(next);
	
});


// drag code


