CloudFlare.define("tipjar",
    ["tipjar/config", "cloudflare/jquery1.7"],
    function(config,$)
    {		
    	window.SESSION_ID = null;
		window.tip = null;

		window.addEventListener("message", finishOAuth, false);

		// capture Enter key for input fields
		$('#amount').keypress(function(event) {
			if (event.keyCode == 13) {
				event.stopPropagation();
				startOAuth(); 
			}
		});
		$('#pin').keypress(function(event) {
			if (event.keyCode == 13) {
				event.stopPropagation();
				sendPayment(); 
			}
		});

		function initialize() {
			loadCSS();
			$.getScript( "http://cdnjs.cloudflare.com/ajax/libs/magnific-popup.js/0.8.9/jquery.magnific-popup.min.js", function() {});
			loadHTML();

			$("#hide_tipjar_frame").click(hideTipjar);
			$("#start").click(startOAuth);
			$("#tipjar_button").click(displayTipjarFrame);
			$("#hide_tipjar").click(hideTipjar);

    		if (config.display_mode == "visits") {
    			total_visits = logVisit();
    			if (total_visits >= parseInt(config.visit_threshold)) {
    				displayTipjar();
    			}
    		}
    		else if (config.display_mode == "time") startTimer(parseInt(config.time_threshold));
    		
    		else if (config.display_mode == "always") displayTipjar();
    	}
    	function logVisit() {
    		// store # of visits in cookie.
    		// return number of total visits
    		previous_visits = parseInt(getCookie("tj_visits"));
    		if (isNaN(previous_visits)) previous_visits = 0;
    		if (previous_visits < 0) return;
    		document.cookie = "tj_visits=" + (previous_visits + 1);
    		return previous_visits + 1;
    	}
    	function setVisits(number) {
    		document.cookie = "tj_visits=" + number;
    	}
		function startOAuth() {
			// store tip amount for later
			window.tip = $("#amount")[0].value;

			$.magnificPopup.open({
			    items: {
			      src: "http://cloudflare-tipjar.herokuapp.com/start_oauth?domain=" + window.location.host,
			    },
			    type: 'iframe'
			});
			return;
		}

		function finishOAuth(event) {
			// event listener, listens for message from oauth iframe.
			// When triggered, stores session id and closes iframe
			// then updates tipjar frame with PIN form
			if (event.data.session_id === undefined) return;
			$.magnificPopup.close();
			session_id = event.data.session_id;
			console.log(event.data)
			console.log(event.data.session_id)
			if (!session_id) return;

			// store session ID for sendPayment()
			window.SESSION_ID = session_id;

			// transition to confirm screen
			$('#copy_heading').html("Please authorize this transaction.");
			$('#copy_body').html("You are tipping $" + window.tip);
			$('#midsection').html('&nbsp;');
			$("#endsection").html('<input id="pin" name="pin" placeholder="PIN" type="password" maxlength="4"><a class="button" onclick="sendPayment();">Done</a>');

			return;
		}

		function congratulations() {
			$('#copy_heading').html("You're a good human.");
			$('#copy_body').html("");
			$('#midsection').html("You tipped the author $" + window.tip);
			$('#endsection').html('<a class="button" onclick="hideTipjar();">Close</a>');
		}

		function sendPayment() {
			// send payment amount, PIN, and session id, and domain to server
			// display response to user
			pin = $("#pin")[0].value;
			$.post("http://cloudflare-tipjar.herokuapp.com/send_payment", { 
				session_id: window.session_id, 
				amount: window.tip, 
				destination: config.destination,
				pin: pin
			}).done( 
				function(data) {
					if (data.success) congratulations();
					else $('#midsection').html("Please try again.");
				});
			return;
		}

		function displayTipjar() {
			$('#tipjar')[0].style.display = 'block';
			return;
		}

		function startTimer(time) {
			// waits time seconds before displaying tipjar
			setTimeout(displayTipjar, 1000 * time);
		}

		function hideTipjar() {
			$('#tipjar')[0].style.display = 'none';
			$('#tipjar_frame')[0].style.display = 'none';
			// hide tipjar forever, if using visits mode:
			setVisits(-1);
		}

		function displayTipjarFrame() {
			$('#tipjar')[0].style.display = 'none';
			$('#tipjar_frame')[0].style.display = 'block';
		}

		function getCookie(name) {
		    var nameEQ = name + "=";
		    var ca = document.cookie.split(';');
		    for(var i=0;i < ca.length;i++) {
		        var c = ca[i];
		        while (c.charAt(0)==' ') c = c.substring(1,c.length);
		        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		    }
		    return null;
		}

		function loadCSS() {
			// when CSS is finalized, throw it in here
			tipjar_style = $("<style>#tipjar_frame{position:fixed;bottom:0;width:100%;height:100px;padding-top:20px;padding-bottom:20px;background-color:#fff;font-family:'Lucida Grande','Lucida Sans Unicode','Lucida Sans',Geneva,Verdana,sans-serif;display:none}#tipjar{position:fixed;display:none;bottom:0;width:140px;height:140px;right:20px}#tipjar img{width:100%;height:100%}#copy{width:30%;height:100%;float:left}#copy_heading{font-weight:700}#midsection{width:40%;float:left}#endsection{width:30%;float:left}#hide_tipjar{position:absolute;right:10px;top:-20px}#hide_tipjar_frame{position:absolute;right:20px}#tipjar_form{padding-left:20px;width:400px;height:60px}#dollarsign{font-size:2em}.button{height:100%;width:30px;border:5px solid #fff;-webkit-box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);-moz-box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);padding:15px;background:green;color:#fff;font-size:2em}input{border:5px solid #fff;-webkit-box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);-moz-box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);box-shadow:inset 0 0 8px rgba(0,0,0,.1),0 0 16px rgba(0,0,0,.1);padding:15px;background:rgba(255,255,255,.5);margin:0 0 10px;width:180px;font-size:2em}</style>").appendTo('head');
			magnific_style = $("<style>.mfp-bg{top:0;left:0;width:100%;height:100%;z-index:1042;overflow:hidden;position:fixed;background:#0b0b0b;opacity:.8;filter:alpha(opacity=80)}.mfp-wrap{top:0;left:0;width:100%;height:100%;z-index:1043;position:fixed;outline:0!important;-webkit-backface-visibility:hidden}.mfp-container{text-align:center;position:absolute;width:100%;height:100%;left:0;top:0;padding:0 8px;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.mfp-container:before{content:'';display:inline-block;height:100%;vertical-align:middle}.mfp-align-top .mfp-container:before{display:none}.mfp-content{position:relative;display:inline-block;vertical-align:middle;margin:0 auto;text-align:left;z-index:1045}.mfp-ajax-holder .mfp-content,.mfp-inline-holder .mfp-content{width:100%;cursor:auto}.mfp-ajax-cur{cursor:progress}.mfp-zoom-out-cur,.mfp-zoom-out-cur .mfp-image-holder .mfp-close{cursor:-moz-zoom-out;cursor:-webkit-zoom-out;cursor:zoom-out}.mfp-zoom{cursor:pointer;cursor:-webkit-zoom-in;cursor:-moz-zoom-in;cursor:zoom-in}.mfp-auto-cursor .mfp-content{cursor:auto}.mfp-arrow,.mfp-close,.mfp-counter,.mfp-preloader{-webkit-user-select:none;-moz-user-select:none;user-select:none}.mfp-loading.mfp-figure{display:none}.mfp-hide{display:none!important}.mfp-preloader{color:#ccc;position:absolute;top:50%;width:auto;text-align:center;margin-top:-.8em;left:8px;right:8px;z-index:1044}.mfp-preloader a{color:#ccc}.mfp-preloader a:hover{color:#fff}.mfp-s-error .mfp-content,.mfp-s-ready .mfp-preloader{display:none}button.mfp-arrow,button.mfp-close{overflow:visible;cursor:pointer;background:0 0;border:0;-webkit-appearance:none;display:block;outline:0;padding:0;z-index:1046;-webkit-box-shadow:none;box-shadow:none}button::-moz-focus-inner{padding:0;border:0}.mfp-close{width:44px;height:44px;line-height:44px;position:absolute;right:0;top:0;text-decoration:none;text-align:center;opacity:.65;padding:0 0 18px 10px;color:#fff;font-style:normal;font-size:28px;font-family:Arial,Baskerville,monospace}.mfp-close:focus,.mfp-close:hover{opacity:1}.mfp-close:active{top:1px}.mfp-close-btn-in .mfp-close{color:#333}.mfp-iframe-holder .mfp-close,.mfp-image-holder .mfp-close{color:#fff;right:-6px;text-align:right;padding-right:6px;width:100%}.mfp-counter{position:absolute;top:0;right:0;color:#ccc;font-size:12px;line-height:18px}.mfp-arrow{position:absolute;opacity:.65;margin:0;top:50%;margin-top:-55px;padding:0;width:90px;height:110px;-webkit-tap-highlight-color:rgba(0,0,0,0)}.mfp-arrow:active{margin-top:-54px}.mfp-arrow:focus,.mfp-arrow:hover{opacity:1}.mfp-arrow .mfp-a,.mfp-arrow .mfp-b,.mfp-arrow:after,.mfp-arrow:before{content:'';display:block;width:0;height:0;position:absolute;left:0;top:0;margin-top:35px;margin-left:35px;border:medium inset transparent}.mfp-arrow .mfp-a,.mfp-arrow:after{border-top-width:13px;border-bottom-width:13px;top:8px}.mfp-arrow .mfp-b,.mfp-arrow:before{border-top-width:21px;border-bottom-width:21px}.mfp-arrow-left{left:0}.mfp-arrow-left .mfp-a,.mfp-arrow-left:after{border-right:17px solid #fff;margin-left:31px}.mfp-arrow-left .mfp-b,.mfp-arrow-left:before{margin-left:25px;border-right:27px solid #3f3f3f}.mfp-arrow-right{right:0}.mfp-arrow-right .mfp-a,.mfp-arrow-right:after{border-left:17px solid #fff;margin-left:39px}.mfp-arrow-right .mfp-b,.mfp-arrow-right:before{border-left:27px solid #3f3f3f}.mfp-iframe-holder{padding-top:40px;padding-bottom:40px}.mfp-iframe-holder .mfp-content{line-height:0;width:100%;max-width:900px}.mfp-iframe-holder .mfp-close{top:-40px}.mfp-iframe-scaler{width:100%;height:0;overflow:hidden;padding-top:56.25%}.mfp-iframe-scaler iframe{position:absolute;display:block;top:0;left:0;width:100%;height:100%;box-shadow:0 0 8px rgba(0,0,0,.6);background:#000}img.mfp-img{width:auto;max-width:100%;height:auto;display:block;line-height:0;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;padding:40px 0;margin:0 auto}.mfp-figure{line-height:0}.mfp-figure:after{content:'';position:absolute;left:0;top:40px;bottom:40px;display:block;right:0;width:auto;height:auto;z-index:-1;box-shadow:0 0 8px rgba(0,0,0,.6);background:#444}.mfp-figure small{color:#bdbdbd;display:block;font-size:12px;line-height:14px}.mfp-figure figure{margin:0}.mfp-bottom-bar{margin-top:-36px;position:absolute;top:100%;left:0;width:100%;cursor:auto}.mfp-title{text-align:left;line-height:18px;color:#f3f3f3;word-wrap:break-word;padding-right:36px}.mfp-image-holder .mfp-content{max-width:100%}.mfp-gallery .mfp-image-holder .mfp-figure{cursor:pointer}@media screen and (max-width:800px) and (orientation:landscape),screen and (max-height:300px){.mfp-img-mobile .mfp-image-holder{padding-left:0;padding-right:0}.mfp-img-mobile img.mfp-img{padding:0}.mfp-img-mobile .mfp-figure:after{top:0;bottom:0}.mfp-img-mobile .mfp-figure small{display:inline;margin-left:5px}.mfp-img-mobile .mfp-bottom-bar{background:rgba(0,0,0,.6);bottom:0;margin:0;top:auto;padding:3px 5px;position:fixed;-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box}.mfp-img-mobile .mfp-bottom-bar:empty{padding:0}.mfp-img-mobile .mfp-counter{right:5px;top:3px}.mfp-img-mobile .mfp-close{top:0;right:0;width:35px;height:35px;line-height:35px;background:rgba(0,0,0,.6);position:fixed;text-align:center;padding:0}}@media all and (max-width:900px){.mfp-arrow{-webkit-transform:scale(0.75);transform:scale(0.75)}.mfp-arrow-left{-webkit-transform-origin:0;transform-origin:0}.mfp-arrow-right{-webkit-transform-origin:100%;transform-origin:100%}.mfp-container{padding-left:6px;padding-right:6px}}.mfp-ie7 .mfp-img{padding:0}.mfp-ie7 .mfp-bottom-bar{width:600px;left:50%;margin-left:-300px;margin-top:5px;padding-bottom:5px}.mfp-ie7 .mfp-container{padding:0}.mfp-ie7 .mfp-content{padding-top:44px}.mfp-ie7 .mfp-close{top:0;right:0;padding-top:0}</style>").appendTo('head');
		}

		function loadHTML() {
			$('<div id="tipjar_frame"><a id="hide_tipjar_frame">X</a><div id="copy"><p id="copy_heading">Did you enjoy this content?</p><p id="copy_body">This is free content, and the author lives on tips, so don&#39;t be afraid to tip!</p></div><div id="midsection"><form id="tipjar_form"><a id="dollarsign">$</a><input id="amount" name="amount" value="1.00" type="number" min="0.01" step="0.01"><a id="start" class="button">Give!</a></form></div><div id="endsection">No thanks, I don&#39;t want to donate to the author.</div></div><div id="tipjar"><img id="tipjar_button" src="http://ajax.cloudflare.com/cdn-cgi/nexp/apps/tipjar/images/tipjar.png"/><a id="hide_tipjar">X</a></div>').appendTo('body');
		}
		
		$(document).ready(initialize);
    }
)
