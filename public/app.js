var OV;
var session;
var localPublisher = null;
var debugMode = false;
var mediaServerUrl;
var sessionName;	// Name of the video session the user will connect to
var token;			// Token retrieved from OpenVidu Server
var isRecording = false;
var isVideoMuting = false;
var isAudioMuting = false;
var isScreenShare = false;
var isHanup = false;
var recording;
var isConnectedSubscriber = false;
var isOwner;


//constants
var serverName = "publisher1"
var destSaveURL = "/var/record/";
var defaultRoomName = "room";
var nickName = "Participant" + Math.floor(Math.random() * 100);
var handupType = "hand-up";
var handUp = "HAND-UP";
var handDown = "HAND-DOWN";

var currentUrl = new URL(window.location.href);
var roomName = currentUrl.searchParams.get("room");
var username = currentUrl.searchParams.get("username");

sessionName = roomName !== null ? roomName : defaultRoomName;
console.log("sessionName name", sessionName);
if (username !== null) {
	nickName = username;
}
console.log("userName", nickName);

if (debugMode) {
	mediaServerUrl = "192.168.136.161:4443";
}
else {
	mediaServerUrl = "kurento.videoqa.com:4443";
}

function joinSession() {
	// --- 1) Get an OpenVidu object ---

	OV = new OpenVidu();
	OV.setAdvancedConfiguration({
		publisherSpeakingEventsOptions: {
			interval: 300,   // Frequency of the polling of audio streams in ms (default 100)
			threshold: -50  // Threshold volume in dB (default -50)
		}
	});

	// --- 2) Init a session ---

	session = OV.initSession();

	// --- 3) Specify the actions when events take place in the session ---

	// On every new Stream received...
	session.on('streamCreated', (event) => {
		console.log(">>>>>>>streamCreated Subscriber", event);
		isConnectedSubscriber = true;
		// Subscribe to the Stream to receive it
		// HTML video will be appended to element with 'remote-video-container' id
		$('#remote-video-container').append(`<div class='video-item-container' id='${event.stream.streamId + "-div"}'><img class="hand" src=""></div>`)
		var subscriber = session.subscribe(event.stream, event.stream.streamId + "-div");

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

	session.on('publisherStartSpeaking', (event) => {
		console.log('>>>>>publisherStartSpeaking event:', event);
		console.log('>>>>>Publisher ' + event.connection.connectionId + ' start speaking');
		var videoElement;
		if ($("video[id*=" + event.connection.connectionId + "]")[0]) {
			videoElement = $("video[id*=" + event.connection.connectionId + "]")[0];
		}
		else {
			videoElement = $("video[id*=local]")[0];
		}

		console.log('>>>>>Publisher Speak Element', videoElement);

		var mainVideo = $('#main-video video').get(0);
		if (mainVideo.srcObject !== videoElement.srcObject) {
			$('#main-video').fadeOut("fast", () => {
				mainVideo.srcObject = videoElement.srcObject;
				$('#main-video').fadeIn("fast");
			});
		}
	});

	session.on('publisherStopSpeaking', (event) => {
		console.log('>>>>>Publisher ' + event.connection.connectionId + ' stop speaking');
	});

	session.on('recordingStarted', (event) => {
		console.log(">>>>>>>recordingStarted: ", event);
		$('#buttonRecord').removeClass("btn-success");
		$('#buttonRecord').addClass("btn-danger");
		$('#buttonRecord').attr("value", "Stop Recording");
		isRecording = true;
		$("#buttonRecord").prop("disabled", false);
	});

	session.on('recordingStopped', (event) => {
		console.log(">>>>>>recordingStopped: ", event.id);
		moveRecording(event.id, destSaveURL);

		$('#buttonRecord').removeClass("btn-danger");
		$('#buttonRecord').addClass("btn-success");
		$('#buttonRecord').attr("value", "Start Recording");
		isRecording = false;
		$("#buttonRecord").prop("disabled", false);
	});

	// Receiver of the message (usually before calling 'session.connect')
	session.on('signal:' + handupType, (event) => {
		console.log(">>>>>> hand-up", event); // Message
	});

	getToken(sessionName).then(token => {

		session.connect(token, { clientData: nickName, serverData: serverName })
			.then(() => {

				// --- 5) Set page layout for active call ---

				// var userName = $("#user").val();
				var userName = serverName;
				$('#session-title').text(sessionName);
				$('#join').hide();
				$('#session').show();

				// Here we check somehow if the user has 'PUBLISHER' role before
				// trying to publish its stream. Even if someone modified the client's code and
				// published the stream, it wouldn't work if the token sent in Session.connect
				// method is not recognized as 'PUBLIHSER' role by OpenVidu Server
				if (isPublisher(userName)) {
					// --- 6) Get your own camera stream ---
					var publisher = OV.initPublisher("local-video-div", {
						audioSource: undefined, // The source of audio. If undefined default microphone
						videoSource: undefined, // The source of video. If undefined default webcam
						publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
						publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
						resolution: '1280x720',  // The resolution of your video
						frameRate: 30,			// The frame rate of your video
						insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
						mirror: false       	// Whether to mirror your local video or not
					});

					// --- 7) Specify the actions when events take place in our publisher ---

					// When our HTML video has been added to DOM...
					publisher.on('videoElementCreated', (event) => {
						console.log(">>>>>>>streamCreated Publisher", event);
						console.log(">>>>>>>streamCreated isOwner, isConnectedSubscriber", isOwner, isConnectedSubscriber);
						if (isOwner == "yes") {
							$("#buttonRecord").show();
							console.log(">>>>>>>buttonRecord shown");
						}
						else {
							if (isConnectedSubscriber) {//already created room.
								$("#buttonRecord").hide();
								isOwner = "no";
								console.log(">>>>>>>buttonRecord hidden");
							}
							else {//first joined user on room.
								$("#buttonRecord").show();
								isOwner = "yes";
								console.log(">>>>>>>buttonRecord shown");
							}
						}

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
					localPublisher = publisher;
				} else {
					console.warn('You don\'t have permissions to publish');
					initMainVideoThumbnail(); // Show SUBSCRIBER message in main video
				}
			})
			.catch(error => {
				console.log('There was an error connecting to the session:', error.code, error.message);
			});
	});

	return false;
}

function moveRecording(sessionName, destDir) {
	return new Promise((resolve, reject) => {
		let data = JSON.stringify({ sessionName: sessionName, destDir: destDir });
		$.ajax({
			type: 'POST',
			url: debugMode ? 'https://192.168.136.161/moveRecording' : 'https://kurento.videoqa.com/moveRecording',
			data: data,
			headers: {
				'Content-Type': 'application/json',
			},
			dataType: 'json',
			success: function (data) {
				console.log(data);
			}
		});
	});
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
	var user = serverName; // Username
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

function getToken(mySessionId) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apisessions
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: 'https://' + mediaServerUrl + "/api/sessions",
			data: JSON.stringify({
				customSessionId: sessionId,
				recordingMode: "MANUAL",
				defaultRecordingLayout: "CUSTOM"
			}),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.id),
			error: (error) => {
				if (error.status === 409) {
					resolve(sessionId);
				} else {
					console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + mediaServerUrl);
					if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + mediaServerUrl + '\"\n\nClick OK to navigate and accept it. ' +
						'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' + mediaServerUrl + '"')) {
						// location.assign(mediaServerUrl + '/accept-certificate');
					}
				}
			}
		});
	});
}

function createToken(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apitokens
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: 'https://' + mediaServerUrl + "/api/tokens",
			data: JSON.stringify({ session: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:MY_SECRET"),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.token),
			error: error => reject(error)
		});
	});
}

/*
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
*/

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
	// logOut();
}

function appendUserData(videoElement, connection) {
	var clientData;
	var serverData;
	var nodeId;
	var userTypeName;

	if (connection.nickName) { // Appending local video data
		clientData = connection.nickName;
		serverData = connection.userName;
		nodeId = 'main-videodata';
		userTypeName = 'Local';

		$("#data-local p").text(clientData);
		//show local video item on main video
		var mainVideo = $('#main-video video').get(0);
		if (mainVideo.srcObject !== videoElement.srcObject) {
			$('#main-video').fadeOut("fast", () => {
				// $('#main-video p.nickName').html(clientData);
				// $('#main-video p.userName').html(serverData);
				mainVideo.srcObject = videoElement.srcObject;
				$('#main-video').fadeIn("fast");
			});
		}
	} else { // Appending remote video data
		clientData = JSON.parse(connection.data.split('%/%')[0]).clientData;
		serverData = serverName;
		// serverData = JSON.parse(connection.data.split('%/%')[1]).serverData;
		nodeId = connection.connectionId;
		userTypeName = 'Remote';

		var dataNode = document.createElement('div');
		dataNode.className = "data-node";
		dataNode.id = "data-" + nodeId;
		dataNode.innerHTML = "<p class='nickName'>" + clientData + "</p>";
		videoElement.parentNode.append(dataNode);
	}
	addClickListener(videoElement, clientData, serverData);
}

function removeUserData(connection) {
	var userNameRemoved = $("#data-" + connection.connectionId);
	if ($(userNameRemoved).find('p.userName').html() === $('#main-video p.userName').html()) {
		cleanMainVideo(); // The participant focused in the main video has left
	}
	// $("#data-" + connection.connectionId).remove();

	console.log(">>>>>>>>removeUserData", $(`div[id*="${connection.connectionId + "-div"}"]`));
	$(`div[id*="${connection.connectionId + "-div"}"]`)[0].remove();
}

function removeAllUserData() {
	$(".data-node").remove();
}

function cleanMainVideo() {
	$('#main-video video').get(0).srcObject = null;
	$('#main-video p').each(function () {
		$(this).html('');
	});

	//add local video item in main video
	videoElement = $("#local-video-div video")[0];
	$('#main-video video').get(0).srcObject = videoElement.srcObject;
	$('#main-video').fadeIn("fast");
}

function addClickListener(videoElement, clientData, serverData) {
	videoElement.addEventListener('click', function () {
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
	$("#buttonRecord").prop("disabled", true);
	if (isRecording) {
		stopRecording();
	}
	else {
		startRecording();
	}
}

function startRecording() {
	var sessionId = session.options.sessionId;
	console.log(">>>>>>>>>startRecording", sessionId);
	// var sessionId = sessionName;

	$.ajax({
		type: 'POST',
		url: 'https://' + mediaServerUrl + '/api/recordings/start',
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
	var sessionId = session.options.sessionId;
	console.log(">>>>>>>>>stopRecording", sessionId);
	// var sessionId = sessionName;

	$.ajax({
		type: 'POST',
		url: 'https://' + mediaServerUrl + '/api/recordings/stop/' + sessionId,
		headers: {
			'Authorization': 'Basic ' + btoa('OPENVIDUAPP:MY_SECRET'),
			'Content-Type': 'application/json',
		},
		success: function (data) {
			console.log(data);
		}
	});
}

function clickedVideoMutingBtn() {
	isVideoMuting = !isVideoMuting;
	if (isVideoMuting) {
		$('#buttonVideoMute').removeClass("btn-success");
		$('#buttonVideoMute').addClass("btn-warning");
		$('#buttonVideoMute').attr("value", "Video Unmute");
	}
	else {
		$('#buttonVideoMute').removeClass("btn-warning");
		$('#buttonVideoMute').addClass("btn-success");
		$('#buttonVideoMute').attr("value", "Video Mute");
	}
	localPublisher.publishVideo(!isVideoMuting);
}

function clickedAudioMutingBtn() {
	isAudioMuting = !isAudioMuting;
	if (isAudioMuting) {
		$('#buttonAudioMute').removeClass("btn-success");
		$('#buttonAudioMute').addClass("btn-warning");
		$('#buttonAudioMute').attr("value", "Audio Unmute");
	}
	else {
		$('#buttonAudioMute').removeClass("btn-warning");
		$('#buttonAudioMute').addClass("btn-success");
		$('#buttonAudioMute').attr("value", "Audio Mute");
	}
	localPublisher.publishAudio(!isAudioMuting);
}

function clickedScreenShareBtn() {
	isScreenShare = !isScreenShare;
	if (isScreenShare) {
		screenShare();
	}
	else {
		showLocalCamera();
	}
}

function screenShare() {
	isScreenShare = true;
	$('#buttonScreenShare').removeClass("btn-success");
	$('#buttonScreenShare').addClass("btn-warning");
	$('#buttonScreenShare').attr("value", "Stop Share");

	$("#buttonScreenShare").prop("disabled", true);
	var publisher = OV.initPublisher("local-video-div", { videoSource: "screen" });

	// addClickListener(videoElement, "", "");
	publisher.once('accessAllowed', (event) => {
		session.unpublish(localPublisher);
		localPublisher = publisher;
		session.publish(publisher);

		publisher.stream.getMediaStream().getVideoTracks()[0].addEventListener('ended', () => {
			console.log('User pressed the "Stop sharing" button');
			showLocalCamera();
		});

		publisher.on('videoElementCreated', (event) => {
			console.log(">>>>>>>streamCreated screenShare", event);

			var mainVideo = $('#main-video video').get(0);
			$('#main-video').fadeOut("fast", () => {
				// $('#main-video p.nickName').html(clientData);
				// $('#main-video p.userName').html(serverData);
				mainVideo.srcObject = event.element.srcObject;
				$('#main-video').fadeIn("fast");
			});

			addClickListener(event.element);
			$(event.element).prop('muted', true); // Mute local video
		});
	});

	publisher.once('accessDenied', (event) => {
		console.warn('ScreenShare: Access Denied');
		isScreenShare = false;
		$('#buttonScreenShare').removeClass("btn-warning");
		$('#buttonScreenShare').addClass("btn-success");
		$('#buttonScreenShare').attr("value", "Screen Share");
	});

	$("#buttonScreenShare").prop("disabled", false);
}

function showLocalCamera() {
	isScreenShare = false;
	$('#buttonScreenShare').removeClass("btn-warning");
	$('#buttonScreenShare').addClass("btn-success");
	$('#buttonScreenShare').attr("value", "Screen Share");

	session.unpublish(localPublisher);
	var publisher = OV.initPublisher("local-video-div", {
		audioSource: undefined, // The source of audio. If undefined default microphone
		videoSource: undefined, // The source of video. If undefined default webcam
		publishAudio: true,  	// Whether you want to start publishing with your audio unmuted or not
		publishVideo: true,  	// Whether you want to start publishing with your video enabled or not
		resolution: '1280x720',  // The resolution of your video
		frameRate: 30,			// The frame rate of your video
		insertMode: 'APPEND',	// How the video is inserted in the target element 'video-container'
		mirror: false       	// Whether to mirror your local video or not
	});

	publisher.on('videoElementCreated', (event) => {
		console.log(">>>>>>>streamCreated showLocalCamera", event);

		var mainVideo = $('#main-video video').get(0);
		$('#main-video').fadeOut("fast", () => {
			// $('#main-video p.nickName').html(clientData);
			// $('#main-video p.userName').html(serverData);
			mainVideo.srcObject = event.element.srcObject;
			$('#main-video').fadeIn("fast");
		});

		addClickListener(event.element);
		$(event.element).prop('muted', true); // Mute local video
	});

	session.publish(publisher);
	localPublisher = publisher;
}

function handleHandup() {
	console.log(">>>>>clicked hand up", isHanup);
	isHanup = !isHanup;
	if (isHanup) {
		$('#hand_img').attr("src", './assets/image/unhand.png');
		$('#hand_button').removeClass("btn-success");
		$('#hand_button').addClass("btn-warning");
		sendHandUp();
	}
	else {
		$('#hand_img').attr("src", './assets/image/hand.png');
		$('#hand_button').removeClass("btn-warning");
		$('#hand_button').addClass("btn-success");
		sendHandDown();
	}
}

function sendHandUp() {
	// Sender of the message (after 'session.connect')
	session.signal({
		data: handUp,  // Any string (optional)
		to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
		type: handupType            // The type of message (optional)
	})
		.then(() => {
			console.log('Message successfully sent');
			$("#local-video-div .hand").attr('src', "./assets/image/hand.png");
		})
		.catch(error => {
			console.error(error);
		});
}

function sendHandDown() {
	// Sender of the message (after 'session.connect')
	session.signal({
		data: handDown,  // Any string (optional)
		to: [],                     // Array of Connection objects (optional. Broadcast to everyone if empty)
		type: handupType            // The type of message (optional)
	})
		.then(() => {
			console.log('Message successfully sent');
			$("#local-video-div .hand").attr('src', "");
		})
		.catch(error => {
			console.error(error);
		});
}

window.onbeforeunload = function () {
	console.log("onbeforeunload isOwner", isOwner);
	sessionStorage.setItem("owner", isOwner);
}

window.onload = function () {
	var valueOwner;
	valueOwner = sessionStorage.getItem("owner");
	console.log("sessionStorage valueOwner", valueOwner);

	if (valueOwner !== null) {
		isOwner = valueOwner;
		console.log("isOwner", isOwner);
	}
}

function updateUrl() {
	var refresh = window.location.protocol + "//" + window.location.host + window.location.pathname + '?room=' + sessionName + '&username=' + nickName;
	window.history.pushState({ path: refresh }, '', refresh);
	$("#buttonRecord").hide();
}

updateUrl();
logIn();
joinSession();
/* APPLICATION BROWSER METHODS */