$(() => {
    const $window = $(window);
    const socket = io('/shooter');
    let up;
    let down;
    let left;
    let right;
    const pressed = [];
    const players = [];
    let me = 'p1';
    let shooted = 0;
    const mouse = {};
    const life = 5;

    // Game over code

    socket.on('kill', ({player}) => {
		$(`#${player}`).remove();
	});

    // Shooter code

    function getShootPoint(player, x, y, hipo){
        let cat_op;
        let cat_ad;
        let left;
        let top;
        const matrix = $(`#${player}`).css('transform');
        const values = matrix.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        const angle = Math.round(Math.atan2(b, a) * (180/Math.PI));

        cat_op = Math.floor(Math.sin(Math.PI/180 * angle) * hipo);
        cat_ad = Math.floor(Math.sqrt(hipo ** 2 - cat_op ** 2));

        if(angle > 90 || angle < -90){
			left = x - cat_ad;
		}else{
			left = x + cat_ad;
		}
        top = y + cat_op;
        return {left, top};
    }

    function myshoot(id, start, end, time){
		const $bullet = $('<div>').addClass('bullet').attr('id', id);
		$('body').append($bullet);

		$(`#${id}`).offset(start).each(function(){
			$(this).css('transform', $(`#${me}`).css('transform'));
			$(this).animate({
				left: end.left,
				top: end.top
			}, {duration: time, step(now, fx) {
				let all = $('.player').overlaps($('.bullet'));
				if(all.hits.length){
					$(this).remove();
				}
			}, complete() {
				$(this).remove();
			}});
		});
	}

    function beingHit(bullet){
		if($('img').length){
			const aaah = new Audio('mp3/aaah.mp3');
			aaah.play();
			$('img').first().remove();
		}else{
			const death = new Audio('mp3/pac_death.mp3');
			death.play();
			$(`#${me}`).remove();
			$('.logout').show();
			socket.emit('kill', {player: me});
		}
	}

    function fire(shooter, id, start, end, time){
		const $bullet = $('<div>').addClass('bullet').attr('id', id);
		$('body').append($bullet);

		$(`#${id}`).offset(start).each(function(){
			$(this).css('transform', $(`#${shooter}`).css('transform'));
			$(this).animate({
				left: end.left,
				top: end.top
			}, {duration: time, step(now, fx) {
				if($(`#${me}`).length){
					const mehit = $(this).overlaps($(`#${me}`));
					if(mehit.hits.length){
						beingHit($(this).attr('id'));
						$(this).remove();
					}
				}
			}, complete() {
				$(this).remove();
			}});
		});
	}

    $('body').on('click', event => {
		const p = $(`#${me}`).position();
		const b_start = getShootPoint(me, p.left, p.top, 30);
		const b_end = getShootPoint(me, p.left, p.top, 500);
		const id = me+shooted;
		const time = 300;
		const lazer = new Audio('mp3/lazer.mp3'); // LAZER SHOOT AUDIO USES TOO MUCH INTERNET
		lazer.play();

		myshoot(id, b_start, b_end, time);

		const data = {shooter : me, bullet: id, start: b_start, end: b_end, time};
		socket.emit('shoot', data);
		shooted += 1;
	});

    socket.on('shoot', data => {
		fire(data.shooter, data.bullet, data.start, data.end, data.time);
	});

    // Login and startup code

    /* var impossible = new Audio('mp3/impossible.mp3'); // MUSIC USE TOO MUCH INTERNET
	impossible.addEventListener('ended', function() {
	    this.currentTime = 0;
	    this.play();
	}, false);
	impossible.volume = 0.5;
	impossible.play(); */

    $('#player').on('keypress', ({which}) => {
		if(which == 32)
			return false;
	});

    $('#player').focus();

    function getNewPosition(){
		return {top: Math.floor(768*Math.random()), left: Math.floor(Math.random()*1366)};
	}

    function putPlayer(player, position){
		const $player = $('<div>').addClass('player')
						.attr('id', player)
						.append(`<div>${player}</div>`);
			$('body').append($player);
			$(`#${player}`).offset(position);
	}

    $('#player').keydown(({which}) => {
		if(which == 13 && $('#player').val() != ''){
			me = $('#player').val();
			const p = getNewPosition();
			putPlayer(me, p);
			socket.emit('addPlayer', {name: me, position: p});
			$('.login').hide();
			$('#p1').hide();
		}
	});

    socket.on('addPlayer', ({name, position}) => {
		putPlayer(name, position);
		players.push({name: name, score: 0});
	});

    socket.on('oldPlayers', data => {
		data.old_name = me;
		data.old_position = $(`#${me}`).position();
		socket.emit('oldPlayer', data);
	});

    socket.on('loadPlayers', ({old_name, old_position}) => {
		const $player = $('<div>').addClass('player')
						.attr('id', old_name)
						.append(old_name);
		$('body').append($player);
		$(`#${old_name}`).offset(old_position);
	});

    // Player rotation code

    function getDegree(x1, y1, x2, y2){
		const dx = x2 - x1;
		const dy = y2 - y1;
		return Math.atan2(dx,  dy) / Math.PI * 180;
	}

    function turn(player){
		let p = $(`#${player}`).position();
    if(p){
      let deg = getDegree(p.left, mouse.y, mouse.x, p.top)-90;
      $(`#${me}`).css('transform', `rotate(${deg}deg)`);
      socket.emit('turn', {player, degree: deg});
    }
	}

    $(document).on('mousemove', ({pageX, pageY}) => {
		mouse.x = pageX;
		mouse.y = pageY;
		turn(me);
	});

    socket.on('turn', ({player, degree}) => {
		$(`#${player}`).css('transform', `rotate(${degree}deg)`);
	});

    // Player movement code

    $window.keydown(({which}) => {
    if($(`#${me}`).length != 0){
      if(which == 87){ // up
        if(!pressed[87]){
          up = true;
          pressed[87] = true;
        }
      }else if (which == 83){ // down
        if(!pressed[83]){
          down = true;
          pressed[83] = true;
        }
      }else if (which == 65){ // left
        if(!pressed[65]){
          left = true;
          pressed[65] = true;
        }
      }else if (which == 68){ // right
        if(!pressed[68]){
          right = true;
          pressed[68] = true;
        }
      }
    }
	});

    $window.keyup(({which}) => {
		if(which == 87){ // up
			if(up){
				up = false;
			}
			pressed[87] = false;
		}else if (which == 83){ // down
			if(down){
				down = false;
			}
			pressed[83] = false;
		}else if (which == 65){ // left
			if(left){
				left = false;
			}
			pressed[65] = false;
		}else if (which == 68){ // right
			if(right){
				right = false;
			}
			pressed[68] = false;
		}
	});

    function move(){
		if(up){
			turn(me);
			var p = $(`#${me}`).offset();
			$(`#${me}`).offset({top: p.top-1});
			socket.emit('setPosition', {player: me, pos: p});
		};
		if(down){
			turn(me);
			var p = $(`#${me}`).offset();
			$(`#${me}`).offset({top: p.top+1});
			socket.emit('setPosition', {player: me, pos: p});
		};
		if(left){
			turn(me);
			var p = $(`#${me}`).offset();
			$(`#${me}`).offset({left: p.left-1});
			socket.emit('setPosition', {player: me, pos: p});
		};
		if(right){
			turn(me);
			var p = $(`#${me}`).offset();
			$(`#${me}`).offset({left: p.left+1});
			socket.emit('setPosition', {player: me, pos: p});
		};
	}

    socket.on('setPosition', ({player, pos}) => {
		$(`#${player}`).offset(pos);
	});

    window.setInterval(move, 1);
});