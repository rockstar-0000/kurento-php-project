var OV;
var session;

var sessionName = "room";	// Name of the video session the user will connect to
var nickName = "Participant " + Math.floor(Math.random() * 100);
var token;			// Token retrieved from OpenVidu Server
var isRecording = false;
var recording;

function joinSession() {
	getToken((token) => {

		console.log(">>>>>token", token);

		// --- 1) Get an OpenVidu object ---

		OV = new OpenVidu();
		OV.setAdvancedConfiguration({
			publisherSpeakingEventsOptions: {
				interval: 100,   // Frequency of the polling of audio streams in ms (default 100)
				threshold: -50  // Threshold volume in dB (default -50)
			}
		});

		// --- 2) Init a session ---

		session = OV.initSession();

		// --- 3) Specify the actions when events take place in the session ---

		// On every new Stream received...
		session.on('streamCreated', (event) => {

			// Subscribe to the Stream to receive it
			// HTML video will be appended to element with 'video-container' id
			var subscriber = session.subscribe(event.stream, 'video-container');

			// When the HTML video has been appended to DOM...
			subscriber.on('videoElementCreated', (event) => {

				// Add a new HTML element for the user's name and nickname over its video
				appendUserData(event.element, subscriber.stream.connection);
			});
		});

		// On every Stream destroyed...
		session.on('streamDestroyed', (event) => {
			// Delete the HTML element with the user's name and nickname
			removeUserData(event.stream.connection);
		});

		// --- 4) Connect to the session passing the retrieved token and some more data from
		//        the client (in this case a JSON with the nickname chosen by the user) ---

		// var nickName = $("#nickName").val();
		session.connect(token, { clientData: nickName })
			.then(() => {

				// --- 5) Set page layout for active call ---

				// var userName = $("#user").val();
				var userName = "publisher1";
				$('#session-title').text(sessionName);
				$('#join').hide();
				$('#session').show();


				// Here we check somehow if the user has 'PUBLISHER' role before
				// trying to publish its stream. Even if someone modified the client's code and
				// published the stream, it wouldn't work if the token sent in Session.connect
				// method is not recognized as 'PUBLIHSER' role by OpenVidu Server
				if (isPublisher(userName)) {

					// --- 6) Get your own camera stream ---

					var publisher = OV.initPublisher('video-container', {
						audioSource: undefined, // The source of audio. If undefined default microphone
						videoSource: undefined, // The source of video. If undefined default webcam
						publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
						publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
						resolution: '640x480',  // The resolution of your video
						frameRate: 30,			// The frame rate of your video
						insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
						mirror: false       	// Whether to mirror your local video or not
					});

					// --- 7) Specify the actions when events take place in our publisher ---

					// When our HTML video has been added to DOM...
					publisher.on('videoElementCreated', (event) => {
						// Init the main video with ours and append our data
						var userData = {
							nickName: nickName,
							userName: userName
						};
						initMainVideo(event.element, userData);
						appendUserData(event.element, userData);
						$(event.element).prop('muted', true); // Mute local video
					});

					// publisher.on('streamAudioVolumeChange', (event) => {
					// 	console.log('>>>>>Publisher audio volume event ', event);
					// 	console.log('>>>>>Publisher audio volume change from ' + event.value.oldValue + ' to' + event.value.newValue);
					// });

					// --- 8) Publish your stream ---

					session.publish(publisher);

				} else {
					console.warn('You don\'t have permissions to publish');
					initMainVideoThumbnail(); // Show SUBSCRIBER message in main video
				}
			})
			.catch(error => {
				console.warn('There was an error connecting to the session:', error.code, error.message);
			});

		session.on('publisherStartSpeaking', (event) => {
			console.log('>>>>>publisherStartSpeaking event:', event);
			console.log('>>>>>Publisher ' + event.connection.connectionId + ' start speaking');
			var videoElement;
			// $("[id*="+toggleGroup+"]")
			if ($("[id*=" + event.connection.connectionId + "]")[0]) {
				videoElement = $("[id*=" + event.connection.connectionId + "]")[0];
			}
			else {
				videoElement = $("[id*=local]")[0];
			}

			console.log('>>>>>Publisher Speak Element', videoElement);

			var mainVideo = $('#main-video video').get(0);
			if (mainVideo.srcObject !== videoElement.srcObject) {
				$('#main-video').fadeOut("fast", () => {
					// $('#main-video p.nickName').html(clientData);
					// $('#main-video p.userName').html(serverData);
					mainVideo.srcObject = videoElement.srcObject;
					$('#main-video').fadeIn("fast");
				});
			}
		});

		session.on('publisherStopSpeaking', (event) => {
			console.log('>>>>>Publisher ' + event.connection.connectionId + ' stop speaking');
		});
	});

	return false;
}

function leaveSession() {

	// --- 9) Leave the session by calling 'disconnect' method over the Session object ---

	session.disconnect();
	session = null;

	// Removing all HTML elements with the user's nicknames
	cleanSessionView();

	$('#join').show();
	$('#session').hide();
}

/* OPENVIDU METHODS */



/* APPLICATION REST METHODS */

function logIn() {
	// var user = $("#user").val(); // Username
	// var pass = $("#pass").val(); // Password
	var user = "publisher1"; // Username
	var pass = "pass"; // Password

	httpPostRequest(
		'api-login/login',
		{ user: user, pass: pass },
		'Login WRONG',
		(response) => {
			$("#name-user").text(user);
			$("#not-logged").hide();
			$("#logged").show();
			// Random nickName and session
			// $("#sessionName").val("Session " + Math.floor(Math.random() * 10));
			// $("#sessionName").val("room");
			// $("#nickName").val("Participant " + Math.floor(Math.random() * 100));
		}
	);
}

function logOut() {
	// httpPostRequest(
	// 	'api-login/logout',
	// 	{},
	// 	'Logout WRONG',
	// 	(response) => {
	// 		$("#not-logged").show();
	// 		$("#logged").hide();
	// 	}
	// );
}

function getToken(callback) {
	// sessionName = $("#sessionName").val(); // Video-call chosen by the user

	httpPostRequest(
		'api-sessions/get-token',
		{ sessionName: sessionName },
		'Request of TOKEN gone WRONG:',
		(response) => {
			token = response[0]; // Get token from response
			console.warn('Request of TOKEN gone WELL (TOKEN:' + token + ')');
			callback(token); // Continue the join operation
		}
	);
}

function removeUser() {
	httpPostRequest(
		'api-sessions/remove-user',
		{ sessionName: sessionName, token: token },
		'User couldn\'t be removed from session',
		(response) => {
			console.warn("You have been removed from session " + sessionName);
		}
	);
}

function httpPostRequest(url, body, errorMsg, callback) {
	var http = new XMLHttpRequest();
	http.open('POST', url, true);
	http.setRequestHeader('Content-type', 'application/json');
	http.addEventListener('readystatechange', processRequest, false);
	http.send(JSON.stringify(body));

	function processRequest() {
		if (http.readyState == 4) {
			if (http.status == 200) {
				try {
					callback(JSON.parse(http.responseText));
				} catch (e) {
					callback();
				}
			} else {
				console.warn(errorMsg);
				console.warn(http.responseText);
			}
		}
	}
}

/* APPLICATION REST METHODS */



/* APPLICATION BROWSER METHODS */

window.onbeforeunload = () => { // Gracefully leave session
	if (session) {
		removeUser();
		leaveSession();
	}
	logOut();
}

function appendUserData(videoElement, connection) {
	var clientData;
	var serverData;
	var nodeId;
	var userTypeName;

	console.log(">>>>>appendUserData: videoElement", videoElement);
	console.log(">>>>>appendUserData: connection", connection);
	if (connection.nickName) { // Appending local video data
		clientData = connection.nickName;
		serverData = connection.userName;
		nodeId = 'main-videodata';
		userTypeName = 'Local';
	} else {
		clientData = JSON.parse(connection.data.split('%/%')[0]).clientData;
		serverData = JSON.parse(connection.data.split('%/%')[1]).serverData;
		nodeId = connection.connectionId;
		userTypeName = 'Remote';
	}
	var dataNode = document.createElement('div');
	dataNode.className = "data-node";
	dataNode.id = "data-" + nodeId;
	// dataNode.innerHTML = "<p class='nickName'>" + clientData + "</p><p class='userTypeName'>" + userTypeName + "</p>";
	// videoElement.parentNode.append(dataNode, videoElement.nextSibling);	
	addClickListener(videoElement, clientData, serverData);
}

function removeUserData(connection) {
	var userNameRemoved = $("#data-" + connection.connectionId);
	if ($(userNameRemoved).find('p.userName').html() === $('#main-video p.userName').html()) {
		cleanMainVideo(); // The participant focused in the main video has left
	}
	$("#data-" + connection.connectionId).remove();
}

function removeAllUserData() {
	$(".data-node").remove();
}

function cleanMainVideo() {
	$('#main-video video').get(0).srcObject = null;
	$('#main-video p').each(function () {
		$(this).html('');
	});
}

function addClickListener(videoElement, clientData, serverData) {
	videoElement.addEventListener('click', function () {
		var mainVideo = $('#main-video video').get(0);
		if (mainVideo.srcObject !== videoElement.srcObject) {
			$('#main-video').fadeOut("fast", () => {
				$('#main-video p.nickName').html(clientData);
				$('#main-video p.userName').html(serverData);
				mainVideo.srcObject = videoElement.srcObject;
				$('#main-video').fadeIn("fast");
			});
		}
	});
}

function initMainVideo(videoElement, userData) {
	$('#main-video video').get(0).srcObject = videoElement.srcObject;
	$('#main-video p.nickName').html(userData.nickName);
	$('#main-video p.userName').html(userData.userName);
	$('#main-video video').prop('muted', true);
}

function initMainVideoThumbnail() {
	$('#main-video video').css("background", "url('images/subscriber-msg.jpg') round");
}

function isPublisher(userName) {
	return userName.includes('publisher');
}

function cleanSessionView() {
	removeAllUserData();
	cleanMainVideo();
	$('#main-video video').css("background", "");
}

function clickedRecordingBtn() {
	console.log(">>>>>>clickedRecordingBtn", isRecording);
	if (isRecording) {
		stopRecording();

		$('#buttonRecord').removeClass("btn-danger");
		$('#buttonRecord').addClass("btn-success");
		$('#buttonRecord').attr("value", "Stop Recording");
	}
	else {
		startRecording();
		
		$('#buttonRecord').removeClass("btn-success");
		$('#buttonRecord').addClass("btn-danger");
		$('#buttonRecord').attr("value", "Start Recording");
	}
	isRecording = !isRecording;
}

function startRecording() {

	console.log(">>>>>>>>>startRecording", session);
	var sessionId = session.options.sessionId;

	$.ajax({
		type: 'POST',
		url: 'https://192.168.136.161:4443/api/recordings/start',
		data: JSON.stringify({ session: sessionId, "outputMode": "COMPOSED", "recordingLayout": "CUSTOM" }),
		headers: {
			'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
			'Content-Type': 'application/json',
		},
		dataType: 'json',
		success: function (data) {
			console.log(data);
		}
	});
}

function stopRecording() {
	console.log(">>>>>>>>>stopRecording", session);
	var sessionId = session.options.sessionId;

	$.ajax({
		type: 'POST',
		url: 'https://192.168.136.161:4443/api/recordings/stop/'+sessionId,
		headers: {
			'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
			'Content-Type': 'application/json',
		},
		success: function (data) {
			console.log(data);
		}
	});
}

logIn();
joinSession();
/* APPLICATION BROWSER METHODS */