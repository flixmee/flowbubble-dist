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
 * It answers in Vietnamese when the request's `lang` starts with "vi", otherwise in English.
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

  var REPLIES = {
    en: {
      bad: 'Message rejected by validation.',
      rate: 'Too many messages.',
      markdown: '## Markdown-lite\nHere is **bold**, *italic*, `inline code` and a [safe link](https://example.com).\n\n' +
        '- First item\n- Second item with https://example.org\n\n1. One\n2. Two\n\n```\nconst x = 42;\nconsole.log(x);\n```\n\n' +
        'A [javascript link](javascript:alert(1)) stays plain text, and <b>HTML</b> is shown literally.',
      plans: 'Which plan are you interested in?\n[[QUICK: Starter | Pro | Enterprise]]',
      starter: '**Starter** is $9/month: one site and 1,000 conversations.\n[[QUICK: Pro | Enterprise | Contact]]',
      pro: '**Pro** is $29/month: five sites and priority support.\n[[QUICK: Starter | Enterprise | Contact]]',
      enterprise: '**Enterprise** has custom pricing. Want us to get in touch?\n[[QUICK: Contact | Opening hours]]',
      pricing: 'Plans start at **$9/month**. The *Pro* plan adds priority support.\n[[QUICK: Starter | Pro | Enterprise]]',
      hours: 'We are open **Mon–Fri, 9:00–18:00**.',
      contact: 'You can reach us at **hello@example.com** or through the [contact page](https://example.com/contact).',
      thanks: function (name) { return 'Thanks, ' + name + '. '; },
      echo: function (text) {
        return 'You said: “' + text + '”. This is a mock reply, so try one of these.\n[[QUICK: Pricing | Opening hours | Contact | markdown]]';
      }
    },
    vi: {
      bad: 'Tin nhắn không hợp lệ.',
      rate: 'Bạn gửi quá nhiều tin nhắn.',
      markdown: '## Markdown rút gọn\nĐây là **chữ đậm**, *chữ nghiêng*, `mã trong dòng` và một [liên kết an toàn](https://example.com).\n\n' +
        '- Mục thứ nhất\n- Mục thứ hai có https://example.org\n\n1. Một\n2. Hai\n\n```\nconst x = 42;\nconsole.log(x);\n```\n\n' +
        'Một [liên kết javascript](javascript:alert(1)) chỉ hiện dạng chữ thường, và <b>HTML</b> được hiển thị nguyên văn.',
      plans: 'Bạn quan tâm đến gói nào?\n[[QUICK: Cơ bản | Chuyên nghiệp | Doanh nghiệp]]',
      starter: 'Gói **Cơ bản** giá 199.000 ₫/tháng: một website và 1.000 cuộc trò chuyện.\n[[QUICK: Chuyên nghiệp | Doanh nghiệp | Liên hệ]]',
      pro: 'Gói **Chuyên nghiệp** giá 699.000 ₫/tháng: năm website và hỗ trợ ưu tiên.\n[[QUICK: Cơ bản | Doanh nghiệp | Liên hệ]]',
      enterprise: 'Gói **Doanh nghiệp** có giá theo nhu cầu. Bạn có muốn chúng tôi liên hệ không?\n[[QUICK: Liên hệ | Giờ mở cửa]]',
      pricing: 'Các gói có giá từ **199.000 ₫/tháng**. Gói *Chuyên nghiệp* có thêm hỗ trợ ưu tiên.\n[[QUICK: Cơ bản | Chuyên nghiệp | Doanh nghiệp]]',
      hours: 'Chúng tôi mở cửa **thứ Hai đến thứ Sáu, 9:00–18:00**.',
      contact: 'Bạn có thể liên hệ qua **hello@example.com** hoặc [trang liên hệ](https://example.com/contact).',
      thanks: function (name) { return 'Cảm ơn ' + name + '. '; },
      echo: function (text) {
        return 'Bạn vừa nói: “' + text + '”. Đây là câu trả lời mô phỏng, hãy thử một trong các mục sau.\n[[QUICK: Bảng giá | Giờ mở cửa | Liên hệ | markdown]]';
      }
    }
  };

  // Keywords in both languages, checked in this order.
  var TOPICS = [
    ['markdown', ['markdown']],
    ['plans', ['quick', 'plan', 'gói nào']],
    ['starter', ['starter', 'cơ bản']],
    ['pro', ['pro', 'chuyên nghiệp']],
    ['enterprise', ['enterprise', 'doanh nghiệp']],
    ['pricing', ['pricing', 'price', 'giá']],
    ['hours', ['opening', 'hours', 'giờ']],
    ['contact', ['contact', 'liên hệ']]
  ];

  function respond(msg, body) {
    var R = /^vi/i.test(String(body.lang || '')) ? REPLIES.vi : REPLIES.en;
    if (body.type === 'register') {
      guests[body.sessionId] = body.guest;
      try { localStorage.setItem(STORE, JSON.stringify(guests)); } catch (e) {}
      return json(200, { status: 'ok', registered: true, sessionId: body.sessionId });
    }
    if (mock.requireGuest && !guests[body.sessionId]) return json(403, { status: 'error', error: 'guest_required' });
    if (has(msg, 'error')) return json(500, { status: 'error', error: 'internal' });
    if (has(msg, 'bad')) return json(400, { status: 'error', error: R.bad });
    if (has(msg, 'rate')) return json(429, { status: 'error', error: R.rate });

    var reply = '';
    TOPICS.some(function (topic) {
      if (!topic[1].some(function (word) { return has(msg, word); })) return false;
      reply = R[topic[0]];
      return true;
    });
    if (!reply) {
      var guest = guests[body.sessionId];
      reply = (guest && guest.name ? R.thanks(guest.name) : '') + R.echo(body.message);
    }
    return json(200, { status: 'ok', reply: reply, sessionId: body.sessionId });
  }
})();
