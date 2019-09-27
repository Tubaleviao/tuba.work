$(function() {
  const FADE_TIME = 150;
  const COLORS = [
    '#0000ff', '#ffffff', '#ff0099', '#ffff00', // TODO: COLOCAR ANONIMOS SEM TER QUE SE CADASTRAR
    '#ff6600', '#cc00ff', '#ff0000', '#ff00ff',
    '#cccccc', '#00ccff', '#ccff66', '#87ceff'
  ];

  const $window = $(window);
  const $usernameInput = $('.usernameInput'); 
  const $messages = $('.messages'); 
  const $users = $('.users');
  const $inputMessage = $('.inputMessage'); 
  const $title = $('.title'); 

  const $loginPage = $('.login.page'); 
  const $chatPage = $('.chat.page'); 
  const $footer = $('.footer'); 

  let username, room = getRoom();
  let connected = false;
  let $currentInput = $usernameInput.focus();
  let manolos = {};
  let bluered;
  let num_mens = 0;
	
  let socket = io('/chat');

  let setUsername = user => {
    username = user
    if (username) {
			socket.emit('add user', {user: user, room: room})
    }
  }
	
	setUsername(getUser())

  let sendMessage = () => {
    let message = $inputMessage.val()
    if (message && connected) {
      $inputMessage.val('')
      socket.emit('new message', message)
    }
  }

  let log = (message, options) => {
    let $el = $('<li>').addClass('log').text(message)
    addMessageElement($el, options)
  }

  let addChatMessage = (data, options) => {
    let $typingMessages = getTypingMessages(data)
    options = options || {}
    if ($typingMessages.length !== 0) {
      options.fade = false
      $typingMessages.remove()
    }
	
	if(bluered){
		num_mens += 1
		$title.empty()
		$title.prepend('('+num_mens+') '+((room) ? room : 'Chat'))
		//var aaah = new Audio('aaah.mp3');
		//aaah.play();
	}
    
  console.log(data.message)

	options.prepend = true
    let $usernameDiv = $('<span class="username"/>')
      .text(data.username)
      .css('color', getUsernameColor(data.username))
    let $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message)
    let $messageDiv = $('<li class="message" title="'+data.hora+'"/>')
      .data('username', data.username)
      .append($usernameDiv, $messageBodyDiv)

    addMessageElement($messageDiv, options)
  }

  let addMessageElement = (el, options) => {
    let $el = $(el)

    if (!options) {
      options = {}
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = true
    }

    if (options.fade) {
      $el.hide().fadeIn(FADE_TIME)
    }
    if (options.prepend) {
      $messages.prepend($el)
    } else {
      $messages.append($el)
    }
    $messages[0].scrollTop = $messages[0].scrollHeight
  }

  let getTypingMessages = data => {
    return $('.typing.message').filter( i => {
      return $(this).data('username') === data.username
    });
  }

  let getUsernameColor = username => {
    let hash = 7
    for (let i = 0; i < username.length; i++) {
       hash = username.charCodeAt(i) + (hash << 5) - hash
    }
    let index = Math.abs(hash % COLORS.length)
    return COLORS[index]
  }
  
  let addUserElement = el => {
    let $el = $(el)
    $users.prepend($el)
    $users[0].scrollTop = $users[0].scrollHeight
  }
  
  $window.on("blur focus", e => {
		
    let prevType = $(this).data("prevType"); 
    if (prevType != e.type) {   
        switch (e.type) {
            case "blur":
                bluered = true;
                break;
            case "focus":
                bluered = false;
								$title.empty();
								$title.prepend(((room) ? room : 'Chat'));
								num_mens = 0;
                break;
        }
    }
    $(this).data("prevType", e.type);
  })

  $window.keydown( event => {
    if (!(event.ctrlKey || event.metaKey || event.altKey)) {
      $currentInput.focus();
    }
    if (event.which === 13) {
      event.preventDefault();
      if (username) {
				if($currentInput.val().trim() != ""){
					sendMessage();
				}
      } else {
        setUsername();
      }
    }else if(username){
			socket.emit('blink', username);
		}
  });

  $loginPage.click( () => {
    $currentInput.focus();
  });

  $inputMessage.click( () => {
    $inputMessage.focus();
  });

  socket.on('login', data => {
    $loginPage.fadeOut();
    $chatPage.show();
    $loginPage.off('click');
    $currentInput = $inputMessage.focus();
    connected = true;
    let message = "Welcome";
	  $footer.prepend(screen.width+"x"+screen.height);
    log(message, {prepend: true});
  });
  
  socket.on('login failed', data => {
    alert("User already exists");
		username = "";
		window.location.href = "http://chocotuba.work";
  });

  socket.on('new message', data => {
		if(data.room == room){
    	addChatMessage(data);
		}
  });
  
  socket.on('refresh users', data => {
    let x;
		
		if(data.room == room){
			if(data.chats){
				let chats = data.chats;
				chats.forEach(chat => {
					addChatMessage(chat);
				});
			}
			manolos = data.users;
			$users.empty();
			if(manolos){
				manolos.forEach((m, i) => {
					let $el = $('<li>')
					.text(m)
					.addClass(m)
					.css('color', getUsernameColor(m));
					addUserElement($el);
				});
			}
		}
  });
  
  socket.on('log', data => {
    log(data);
  });
  
  socket.on('blink', data => {
	  $('.'+data).css("opacity","0");
	  setTimeout(() => {$('.'+data).css("opacity","1");}, 50);
  })
});