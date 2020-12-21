<html>

<head>
	<title>Kurneto Room</title>

	<meta name="viewport" content="width=device-width, initial-scale=1" charset="utf-8">
	<link rel="shortcut icon" href="images/favicon.ico" type="image/x-icon">

	<!-- Bootstrap -->
	<script src="https://code.jquery.com/jquery-3.3.1.min.js"
		integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
	<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css"
		integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
	<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"
		integrity="sha384-Tc5IQib027qvyjSMfHjOMaLkfuWVxZxUPnCJA7l2mCWNIpG9mGCD8wGNIcPD7Txa"
		crossorigin="anonymous"></script>
	<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
	<!-- Bootstrap -->

	<link rel="styleSheet" href="style.css" type="text/css" media="screen">
	<script src="openvidu-browser-2.12.0.js"></script>
	<script>
		$(document).ready(function () {
			$('[data-toggle="tooltip"]').tooltip({
				html: true
			});
		});
	</script>
</head>

<body>
	<div id="main-container">
		<div id="logged">
			<div id="session">
				<div id="session-header">
					<input class="btn btn-large btn-toggle btn-success" type="button" id="buttonRecord"
						onmouseup="clickedRecordingBtn()" value="Start Recording">
					<input class="btn btn-large btn-toggle btn-success" type="button" id="buttonVideoMute"
						onmouseup="clickedVideoMutingBtn()" value="Video Mute">
					<input class="btn btn-large btn-toggle btn-success" type="button" id="buttonAudioMute"
						onmouseup="clickedAudioMutingBtn()" value="Audio Mute">
					<input class="btn btn-large btn-toggle btn-success" type="button" id="buttonScreenShare"
						onmouseup="clickedScreenShareBtn()" value="Screen Share">
					<button id="hand_button" class="btn btn-success" onclick="handleHandup()">
						<img id="hand_img" src="./assets/image/hand.png" />
					</button>
					<button id="draw_play_button" class="btn btn-large btn-middle-toggle btn-success" onclick="clickedWhiteBoardBtn()">Start Draw</button>
            		<button id="draw_clear_button" class="btn btn-large btn-middle-toggle btn-success" onclick="clearDraw()">Clear Draw</button>
				</div>
				<div id="main-video">
					<video autoplay playsinline="true"></video>
					<canvas id="drawCanvas">Canvas is not supported on this browser!</canvas>
				</div>
				<div id="video-container">
					<div class='video-item-container' id="local-video-div">
						<div class="data-node" id="data-local">
							<p class='nickName'></p>
						</div>
						<img class="hand" id="local-hand" src="">
					</div>
					<div id="remote-video-container">
					</div>
				</div>
			</div>
		</div>
	</div>
	<script src="app.js"></script>
	<script src="./draw.js"></script>
</body>
<script type="module">

</script>

</html>
