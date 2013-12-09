CloudFlare.define("dwolla_tipjar",
  ["dwolla_tipjar/config", "cloudflare/jquery1.7"],
  function(config, $) {
    window.CF_TIPJAR = {};
    window.CF_TIPJAR['SESSION_ID'] = null;
    window.CF_TIPJAR['TIP'] = null;
    window.CF_TIPJAR['API_HOST'] = "https://cloudflare-tipjar.herokuapp.com/";
    //window.CF_TIPJAR['ASSET_HOST'] = "https://cftipjar.s3.amazonaws.com/public/";
    window.CF_TIPJAR['ASSET_HOST'] = "http://mike.dev/public/";

    var bind_events = function() {
      // OAuth processor / listener
      window.addEventListener("message", finishOAuth, false);

      // Cache elements
      var tipjar = $('#tipjar-wrapper');
      var tipjar_ribbon = $('#tipjar-ribbon');
      var oauth = $('#cftipjar-oauth');

      window.CF_TIPJAR['ELEMENTS'] = {
        'tipjar_ribbon': tipjar_ribbon,
        'tipjar': tipjar,
        'amount': tipjar.find('form input[name="tipjar_amount"]'),
        'pin': tipjar.find('input[name="cf_tipjar_pin"]'),
        'step_1': tipjar.find('#tipjar-step-1'),
        'step_2': tipjar.find('#tipjar-step-2'),
        'step_3': tipjar.find('#tipjar-step-3'),
        'loader': tipjar.find('#tipjar-loader'),
        'oauth': oauth,
        'iframe': oauth.find('iframe')
      }

      window.CF_TIPJAR['ELEMENTS']['tipjar_ribbon']
        .click(displayTipjar)
        .find(".hide_btn").click(hideTipjarRibbon).end();

      window.CF_TIPJAR['ELEMENTS']['tipjar']
        .find('.hide_btn').click(hideTipjar).end()
        .find('form')
          .on('submit', function(e) { e.preventDefault(); return false; })

      window.CF_TIPJAR['ELEMENTS']['step_1']
        .find('button').click(startOAuth).end();

      window.CF_TIPJAR['ELEMENTS']['step_2']
        .find('button').click(sendPayment).end();

      window.CF_TIPJAR['ELEMENTS']['step_3']
        .find('button').click(hideTipjar).end();

      window.CF_TIPJAR['ELEMENTS']['oauth']
        .find('.hide_btn').click(closeOauth).end();

      // Capture Enter key for input fields
      window.CF_TIPJAR['ELEMENTS']['amount'].keypress(submitOauthForm);
      window.CF_TIPJAR['ELEMENTS']['pin'].keypress(submitPaymentForm);

      if (config.display_mode == "visits") {
        total_visits = logVisit();

        if (total_visits >= parseInt(config.visit_threshold)) {
          displayTipjarRibbon();
        }
      }
      else if (config.display_mode == "time") {
        startTimer(parseInt(config.time_threshold));
      }
      else if (config.display_mode == "always") {
        displayTipjarRibbon();
      }
    }

    var showLoader = function() {
      window.CF_TIPJAR['ELEMENTS']['step_1'].hide();
      window.CF_TIPJAR['ELEMENTS']['step_2'].hide();
      window.CF_TIPJAR['ELEMENTS']['step_3'].hide();
      window.CF_TIPJAR['ELEMENTS']['loader'].show();
    }

    var hideLoader = function() {
      window.CF_TIPJAR['ELEMENTS']['loader'].hide();
    }

    var submitOauthForm = function(event) {
      if (event.keyCode == 13) {
        e.preventDefault();

        startOAuth();

        return false;
      }
    }

    var submitPaymentForm = function(e) {
      if (event.keyCode == 13) {
        e.preventDefault();

        sendPayment();

        return false;
      }
    }

    var logVisit = function() {
      // store # of visits in cookie.
      // return number of total visits
      var previous_visits = getVisits() || 0;
      var new_visit_count = previous_visits++;

      if (previous_visits < 0) return;

      setVisits(new_visit_count);

      return new_visit_count;
    }

    var setVisits = function(number) {
      document.cookie = "tj_visits=" + number;
    }

    var startOAuth = function() {
      showLoader();

      // store tip amount for later
      window.CF_TIPJAR['TIP'] = window.CF_TIPJAR['ELEMENTS']['amount'].val()

      window.CF_TIPJAR['ELEMENTS']['iframe'].attr('src', window.CF_TIPJAR['API_HOST'] + "start_oauth?domain=" + window.location.host);
      window.CF_TIPJAR['ELEMENTS']['oauth'].show();

      return;
    }

    var closeOauth = function(e) {
      if(e) { e.preventDefault(); }

      window.CF_TIPJAR['ELEMENTS']['oauth'].hide();
      hideLoader();

      window.CF_TIPJAR['ELEMENTS']['step_1'].show();

      return false;
    }

    var finishOAuth = function(event) {
      // event listener, listens for message from oauth iframe.
      // When triggered, stores session id and closes iframe
      // then updates tipjar frame with PIN form
      var session_id = event.data.session_id;
      if (!session_id) return;

      closeOauth();

      // store session ID for sendPayment()
      window.CF_TIPJAR['SESSION_ID'] = session_id;

      window.CF_TIPJAR['ELEMENTS']['step_1'].hide();
      window.CF_TIPJAR['ELEMENTS']['step_2'].show();
      window.CF_TIPJAR['ELEMENTS']['step_3'].hide();

      window.CF_TIPJAR['ELEMENTS']['step_2']
        .find('.tip_amount').html(window.CF_TIPJAR['TIP']).end()

      return;
    }

    var congratulations = function() {
      hideLoader();

      // transition to success screen
      window.CF_TIPJAR['ELEMENTS']['step_1'].hide();
      window.CF_TIPJAR['ELEMENTS']['step_2'].hide();
      window.CF_TIPJAR['ELEMENTS']['step_3'].show();

      window.CF_TIPJAR['ELEMENTS']['step_3']
        .find('.tip_amount').html(window.CF_TIPJAR['TIP']).end()
    }

    var sendPayment = function() {
      // send payment amount, PIN, and session id, and domain to server
      // display response to user
      showLoader();

      $.post(
        window.CF_TIPJAR['API_HOST'] + "send_payment",
        {
          session_id: window.CF_TIPJAR['SESSION_ID'],
          amount: window.CF_TIPJAR['TIP'],
          destination: config.destination,
          pin: window.CF_TIPJAR['ELEMENTS']['pin'].val()
        }
      ).done(function(data) {
        if (!data.success) {
          alert("Please try again.");

          return false;
        }

        return congratulations();
      });
    }

    var hideTipjarRibbon = function() {
      window.CF_TIPJAR['ELEMENTS']['tipjar_ribbon'].removeClass('show');
    }

    var displayTipjarRibbon = function() {
      window.CF_TIPJAR['ELEMENTS']['tipjar_ribbon'].addClass('show');
    }

    var startTimer = function(time) {
      // waits time seconds before displaying tipjar
      setTimeout(displayTipjarRibbon, 1000 * time);
    }

    var hideTipjar = function() {
      hideTipjarRibbon();
      window.CF_TIPJAR['ELEMENTS']['tipjar'].slideUp();

      // hide tipjar forever, if using visits mode:
      setVisits(-1);
    }

    var displayTipjar = function() {
      hideTipjarRibbon();
      window.CF_TIPJAR['ELEMENTS']['tipjar'].slideDown();
    }

    var getVisits = function() {
      var nameEQ = "tj_visits=";
      var ca = document.cookie.split(';');

      for(var i=0; i < ca.length; i++) {
          var c = ca[i];
          while (c.charAt(0) == ' ') c = c.substring(1, c.length);

          if (c.indexOf(nameEQ) == 0) {
            return +c.substring(nameEQ.length, c.length);
          }
      }

      return false;
    }

    var loadCSS = function() {
      $('head').append('<link type="text/css" rel="stylesheet" href="' + window.CF_TIPJAR['ASSET_HOST'] + 'stylesheets/tipjar.css" media="all">');
    }

    var loadHTML = function(callback) {
      $.get(window.CF_TIPJAR['ASSET_HOST'] + 'views/tipjar.html', function(data) {
        $('body').append(data);

        callback();
      })
    }

    var initialize = function() {
      // Inject DOM Elements
      loadCSS();
      loadHTML(bind_events);
    }

    $(document).ready(initialize);
  }
)
