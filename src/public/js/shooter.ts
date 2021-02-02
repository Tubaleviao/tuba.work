interface JQuery{
    overlaps?: Function;
    Coordinates?: any;
}
interface Object{
    right?: number;
    left?: number;
    bottom?: number;
    top?: number;
}

(function($){ // https://raw.githubusercontent.com/yckart/jquery.overlaps.js/master/jquery.overlaps.js
    $.fn.overlaps = function(obj) {
        var elems = {targets: [], hits:[]};
        this.each(function() {
            var bounds = <Object>$(this).offset();
            bounds.right = bounds.left + $(this).outerWidth();
            bounds.bottom = bounds.top + $(this).outerHeight();

            var compare = $(obj).offset();
            compare.right = compare.left + $(obj).outerWidth();
            compare.bottom = compare.top + $(obj).outerHeight(); 

            if (!(compare.right < bounds.left ||
                  compare.left > bounds.right ||
                  compare.bottom < bounds.top ||
                  compare.top > bounds.bottom)
               ) {
                elems.targets.push(this);
                elems.hits.push(obj);
            }
        });
        return elems;
    };
  }(jQuery));

$(function() {

    let $window = $(window);
    let socket = window.io('/shooter');
    let up, down, left, right;
    let pressed = [],
        players = [];
    let me = 'p1';
    let shooted = 0;
    let mouse:{x:number, y:number} = {x: 0, y:0};
    let life = 5;

    // Game over code

    socket.on('kill', function(data) {
        $('#' + data.player).remove();
    });

    // Shooter code

    const getShootPoint = (player, x, y, hipo) => {
        let cat_op, cat_ad, left, top;
        let matrix = $('#' + player).css('transform');
        let values = matrix.split('(')[1].split(')')[0].split(',');
        let a = Number(values[0])
        let b = Number(values[1])
        let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));

        cat_op = Math.floor(Math.sin(Math.PI / 180 * angle) * hipo);
        cat_ad = Math.floor(Math.sqrt(Math.pow(hipo, 2) - Math.pow(cat_op, 2)));

        if (angle > 90 || angle < -90) {
            left = x - cat_ad;
        } else {
            left = x + cat_ad;
        }
        top = y + cat_op;
        return { left: left, top: top };
    }

    const myshoot = (id, start, end, time) => {
        let $bullet = $('<div>').addClass('bullet').attr('id', id);
        $('body').append($bullet);

        $('#' + id).offset(start).each(function() {
            $(this).css('transform', $('#' + me).css('transform'));
            $(this).animate({
                left: end.left,
                top: end.top
            }, {
                duration: time,
                step: function(now, fx) {
                    let all = (<JQuery<HTMLElement>>$('.player')).overlaps($('.bullet'));
                    if (all.hits.length) {
                        $(this).remove();
                    }
                },
                complete: function() {
                    $(this).remove();
                }
            });
        });
    }

    const beingHit = (bullet) => {
        if ($('img').length) {
            let aaah = new Audio('mp3/aaah.mp3');
            aaah.play();
            $('img').first().remove();
        } else {
            let death = new Audio('mp3/pac_death.mp3');
            death.play();
            $('#' + me).remove();
            $('.logout').show();
            socket.emit('kill', { player: me });
        }
    }

    const fire = (shooter, id, start, end, time) => {
        let $bullet = $('<div>').addClass('bullet').attr('id', id);
        $('body').append($bullet);

        $('#' + id).offset(start).each(function() {
            $(this).css('transform', $('#' + shooter).css('transform'));
            $(this).animate({
                left: end.left,
                top: end.top
            }, {
                duration: time,
                step: function(now, fx) {
                    if ($('#' + me).length) {
                        let mehit = $(this).overlaps($('#' + me));
                        if (mehit.hits.length) {
                            beingHit($(this).attr('id'));
                            $(this).remove();
                        }
                    }
                },
                complete: function() {
                    $(this).remove();
                }
            });
        });
    }

    $('body').on('click', (event) => {
        let p = $('#' + me).position();
        if(p){
            let b_start = getShootPoint(me, p.left, p.top, 30);
            let b_end = getShootPoint(me, p.left, p.top, 500);
            let id = me + shooted;
            let time = 300;
            let lazer = new Audio('mp3/lazer.mp3'); // LAZER SHOOT AUDIO USES TOO MUCH INTERNET
            lazer.play();

            myshoot(id, b_start, b_end, time);

            let data = { shooter: me, bullet: id, start: b_start, end: b_end, time: time };
            socket.emit('shoot', data);
            shooted += 1;
        }
    });

    socket.on('shoot', (data) => {
        fire(data.shooter, data.bullet, data.start, data.end, data.time);
    });

    // Login and startup code

    /* let impossible = new Audio('mp3/impossible.mp3'); // MUSIC USE TOO MUCH INTERNET
    impossible.addEventListener('ended', function() {
        this.currentTime = 0;
        this.play();
    }, false);
    impossible.volume = 0.5;
    impossible.play(); */

    $('#player').on('keypress', (e) => {
        if (e.which == 32)
            return false;
    });

    $('#player').focus();

    const getNewPosition = () => {
        return { top: Math.floor(768 * Math.random()), left: Math.floor(Math.random() * 1366) };
    }

    const putPlayer = (player, position) => {
        let $player = $('<div>').addClass('player')
            .attr('id', player)
            .append('<div>' + player + '</div>');
        $('body').append($player);
        $('#' + player).offset(position);
    }

    $('#player').keydown((event) => {
        if (event.which == 13 && $('#player').val() != '') {
            me = $('#player').val().toString();
            let p = getNewPosition();
            putPlayer(me, p);
            socket.emit('addPlayer', { name: me, position: p });
            $('.login').hide();
            $('#p1').hide();
        }
    });

    socket.on('addPlayer', (data) => {
        putPlayer(data.name, data.position);
        players.push({ name: data.name, score: 0 });
    });

    socket.on('oldPlayers', (data) => {
        data.old_name = me;
        data.old_position = $('#' + me).position();
        socket.emit('oldPlayer', data);
    });

    socket.on('loadPlayers', (data) => {
        let $player = $('<div>').addClass('player')
            .attr('id', data.old_name)
            .append(data.old_name);
        $('body').append($player);
        $('#' + data.old_name).offset(data.old_position);
    });

    // Player rotation code

    const getDegree = (x1, y1, x2, y2) => {
        let dx = x2 - x1;
        let dy = y2 - y1;
        return Math.atan2(dx, dy) / Math.PI * 180;
    }

    const turn = player => {
        let p = $('#' + player).position();
        if (p) {
            let deg = getDegree(p.left, mouse.y, mouse.x, p.top) - 90;
            $('#' + me).css('transform', 'rotate(' + deg + 'deg)');
            socket.emit('turn', { player: player, degree: deg });
        }
    }

    $(document).on('mousemove', (event) => {
        mouse.x = event.pageX;
        mouse.y = event.pageY;
        turn(me);
    });

    socket.on('turn', (data) => {
        $('#' + data.player).css('transform', 'rotate(' + data.degree + 'deg)');
    });

    // Player movement code

    $window.keydown((event) => {
        if ($('#' + me).length != 0) {
            if (event.which == 87) { // up
                if (!pressed[87]) {
                    up = true;
                    pressed[87] = true;
                }
            } else if (event.which == 83) { // down
                if (!pressed[83]) {
                    down = true;
                    pressed[83] = true;
                }
            } else if (event.which == 65) { // left
                if (!pressed[65]) {
                    left = true;
                    pressed[65] = true;
                }
            } else if (event.which == 68) { // right
                if (!pressed[68]) {
                    right = true;
                    pressed[68] = true;
                }
            }
        }
    });

    $window.keyup((event) => {
        if (event.which == 87) { // up
            if (up) {
                up = false;
            }
            pressed[87] = false;
        } else if (event.which == 83) { // down
            if (down) {
                down = false;
            }
            pressed[83] = false;
        } else if (event.which == 65) { // left
            if (left) {
                left = false;
            }
            pressed[65] = false;
        } else if (event.which == 68) { // right
            if (right) {
                right = false;
            }
            pressed[68] = false;
        }
    });

    const move = () => {
        if (up) {
            turn(me);
            let p = $('#' + me).offset();
            $('#' + me).offset({ top: p.top - 1 });
            socket.emit('setPosition', { player: me, pos: p });
        };
        if (down) {
            turn(me);
            let p = $('#' + me).offset();
            $('#' + me).offset({ top: p.top + 1 });
            socket.emit('setPosition', { player: me, pos: p });
        };
        if (left) {
            turn(me);
            let p = $('#' + me).offset();
            $('#' + me).offset({ left: p.left - 1 });
            socket.emit('setPosition', { player: me, pos: p });
        };
        if (right) {
            turn(me);
            let p = $('#' + me).offset();
            $('#' + me).offset({ left: p.left + 1 });
            socket.emit('setPosition', { player: me, pos: p });
        };
    }

    socket.on('setPosition', (data) => {
        $('#' + data.player).offset(data.pos);
    });

    window.setInterval(move, 1);

});