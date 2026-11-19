/*
 * Mock FlowBubble backend for the example pages. It is NOT part of the widget.
 *
 * It intercepts fetch() calls to MOCK_URL and answers them in the browser, following the
 * same contract a real FLOWAPP webhook uses:
 *
 *   Register  POST { type: "register", sessionId, guest: { name, phone, email? }, consent, ... }
 *             -> 200 { status: "ok", registered: true }
 *   Chat      POST { sessionId, message, page, lang }
 *             -> 200 { status: "ok", reply, sessionId }
 *             -> 403 { status: "error", error: "guest_required" }   (no guest for this session)
 *             -> 4xx/5xx { status: "error", error }
 *
 * Load it before the widget. Add data-require-guest to make chat return 403 until the
 * guest form has been submitted, like a real backend with the guest gate on:
 *
 *   <script src="mock-backend.js" data-require-guest></script>
 *
 * On a real site you don't need this file: point data-webhook at your own webhook.
 */
(function () {
  var MOCK_URL = 'https://mock.flowbubble.invalid/webhook';
  // Pages can flip requireGuest later through window.FlowBubbleMock (the playground does).
  var mock = window.FlowBubbleMock = {
    url: MOCK_URL,
    requireGuest: !!document.currentScript && document.currentScript.hasAttribute('data-require-guest')
  };
  var realFetch = window.fetch.bind(window);

  // sessionId -> guest. Kept in localStorage so a reload behaves like a real server.
  var STORE = 'flowbubble-example-guests';
  var guests = {};
  try { guests = JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) {}

  window.fetch = function (input, init) {
    if (String(input) !== MOCK_URL) return realFetch(input, init);
    var body = {};
    try { body = JSON.parse(init.body); } catch (e) {}
    var msg = String(body.message || '').toLowerCase();

    return new Promise(function (resolve, reject) {
      if (has(msg, 'offline')) {
        return setTimeout(function () { reject(new TypeError('Failed to fetch')); }, 300);
      }
      var delay = has(msg, 'slow') ? 60000 : 500 + Math.random() * 900;
      var timer = setTimeout(function () { resolve(respond(msg, body)); }, delay);
      if (init.signal) {
        init.signal.addEventListener('abort', function () {
          clearTimeout(timer);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }
    });
  };

  function has(msg, word) { return msg.indexOf(word) !== -1; }

  function json(status, obj) {
    return new Response(JSON.stringify(obj), { status: status, headers: { 'Content-Type': 'application/json' } });
  }

  function respond(msg, body) {
    if (body.type === 'register') {
      guests[body.sessionId] = body.guest;
      try { localStorage.setItem(STORE, JSON.stringify(guests)); } catch (e) {}
      return json(200, { status: 'ok', registered: true, sessionId: body.sessionId });
    }
    if (mock.requireGuest && !guests[body.sessionId]) return json(403, { status: 'error', error: 'guest_required' });
    if (has(msg, 'error')) return json(500, { status: 'error', error: 'internal' });
    if (has(msg, 'bad')) return json(400, { status: 'error', error: 'Message rejected by validation.' });
    if (has(msg, 'rate')) return json(429, { status: 'error', error: 'Too many messages.' });

    var reply;
    if (has(msg, 'markdown')) {
      reply = '## Markdown-lite\nHere is **bold**, *italic*, `inline code` and a [safe link](https://example.com).\n\n' +
        '- First item\n- Second item with https://example.org\n\n1. One\n2. Two\n\n```\nconst x = 42;\nconsole.log(x);\n```\n\n' +
        'A [javascript link](javascript:alert(1)) stays plain text, and <b>HTML</b> is shown literally.';
    } else if (has(msg, 'quick') || has(msg, 'plan')) {
      reply = 'Which plan are you interested in?\n[[QUICK: Starter | Pro | Enterprise]]';
    } else if (has(msg, 'starter')) {
      reply = '**Starter** is $9/month: one site and 1,000 conversations.\n[[QUICK: Pro | Enterprise | Contact]]';
    } else if (has(msg, 'pro')) {
      reply = '**Pro** is $29/month: five sites and priority support.\n[[QUICK: Starter | Enterprise | Contact]]';
    } else if (has(msg, 'enterprise')) {
      reply = '**Enterprise** has custom pricing. Want us to get in touch?\n[[QUICK: Contact | Opening hours]]';
    } else if (has(msg, 'pricing') || has(msg, 'price')) {
      reply = 'Plans start at **$9/month**. The *Pro* plan adds priority support.\n[[QUICK: Starter | Pro | Enterprise]]';
    } else if (has(msg, 'opening') || has(msg, 'hours')) {
      reply = 'We are open **Mon–Fri, 9:00–18:00**.';
    } else if (has(msg, 'contact')) {
      reply = 'You can reach us at **hello@example.com** or through the [contact page](https://example.com/contact).';
    } else {
      var guest = guests[body.sessionId];
      reply = (guest && guest.name ? 'Thanks, ' + guest.name + '. ' : '') +
        'You said: “' + body.message + '”. This is a mock reply, so try one of these.\n' +
        '[[QUICK: Pricing | Opening hours | Contact | markdown]]';
    }
    return json(200, { status: 'ok', reply: reply, sessionId: body.sessionId });
  }
})();
