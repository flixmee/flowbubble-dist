// Playground for example/index.html: reads the options form, (re)loads the widget with them,
// and prints the matching embed code. Example pages only, not part of the widget.
(function () {
  var WIDGET_SRC = '../flowbubble.min.js';
  var SNIPPET_SRC = 'https://your-cdn.com/flowbubble.v0.3.1.js';
  var SNIPPET_WEBHOOK = 'https://your-flowapp-host/api/automation-webhooks/<automation-id>';

  // The widget's own defaults. The embed code leaves out options that still have these values.
  // The five text options are empty by default: the widget then uses the text of its language.
  var WIDGET_DEFAULTS = {
    lang: 'auto',
    title: '',
    subtitle: '',
    greeting: '',
    tooltip: '',
    placeholder: '',
    suggestions: '',
    accent: '#6C5CE7',
    position: 'right',
    theme: 'auto',
    open: 'false',
    typewriter: 'true',
    guestForm: 'off',
    consentText: '',
    contentType: 'json'
  };
  var KEYS = Object.keys(WIDGET_DEFAULTS).concat('webhook');
  var CHECKBOXES = { open: ['true', 'false'], typewriter: ['true', 'false'], guestForm: ['required', 'off'] };

  // Page text, and the widget's built-in text per language (shown as placeholders in the form).
  var PAGE = {
    en: {
      heading: 'FlowBubble playground',
      lead: 'Change the options and the chat bubble in the corner reloads with them. Copy the embed code when you like the result. ' +
        'A mock backend in your browser answers the chat, so nothing is sent anywhere unless you enter your own webhook. ' +
        'See also the <a href="guest-form.html">guest form example</a>.',
      language: 'Language',
      languageHint: 'Sets the language of the widget and of this page. Auto follows the browser.',
      text: 'Text',
      title: 'Title',
      subtitle: 'Subtitle',
      greeting: 'Greeting',
      greetingHint: 'Supports **bold**, *italic*, lists and links. Type off to hide it. Leave a text field empty to use the built-in text of the language.',
      tooltip: 'Launcher tooltip',
      tooltipHint: 'A bubble above the chat button while the chat is closed. Empty: no tooltip.',
      placeholder: 'Input placeholder',
      suggestions: 'Suggestions',
      suggestionsHint: 'Up to 6 chips, separated by <code>|</code>.',
      look: 'Look',
      accent: 'Accent color',
      accentPick: 'Pick accent color',
      position: 'Position',
      left: 'Left',
      right: 'Right',
      theme: 'Theme',
      auto: 'Auto',
      light: 'Light',
      dark: 'Dark',
      behavior: 'Behavior',
      open: 'Open the panel on load',
      typewriter: 'Typewriter reveal of replies',
      guestForm: 'Require the guest form before chatting',
      consentText: 'Consent text',
      backend: 'Backend',
      webhook: 'Webhook URL',
      webhookPlaceholder: 'Empty: use the built-in mock',
      webhookMock: 'The mock answers in your browser.',
      webhookOk: 'Messages are sent to this webhook. It has to allow this page\'s origin.',
      webhookBad: 'This has to be an https:// URL. The mock is used until it is.',
      contentType: 'Content type',
      contentJson: 'json (application/json)',
      contentText: 'text (text/plain, no CORS preflight)',
      reset: 'Reset options',
      embedCode: 'Embed code',
      embedStyle: 'Embed style',
      tabTag: 'Script tag',
      copy: 'Copy',
      copied: 'Copied',
      copyManual: 'Select and copy',
      codeNote: 'Replace the <code>src</code> with where you host the file. Only options that differ from the defaults are listed.',
      tryTitle: 'Things to try',
      tryText: 'With the mock, ask about <code>pricing</code> to get quick-reply chips, or send <code>markdown</code> to see the formatting. ' +
        'These words make it fail, so you can see the error states: <code>error</code> (500), <code>bad</code> (400), ' +
        '<code>rate</code> (429), <code>slow</code> (timeout after 6 s) and <code>offline</code> (network failure).',
      apiTitle: 'JavaScript API',
      eventsLabel: 'Events from <code>FlowBubble.on(…)</code>, newest first:',
      sendExample: 'What are your opening hours?',
      startSuggestions: 'Pricing|Contact|Opening hours|markdown',
      widget: {
        title: 'Support',
        subtitle: 'Typically replies instantly',
        greeting: 'Hi! How can I help you today?',
        placeholder: 'Type a message…',
        consentText: 'I agree that my name and contact details are stored so the team can contact me about my request.'
      }
    },
    vi: {
      heading: 'Trang dùng thử FlowBubble',
      lead: 'Thay đổi các tùy chọn, bong bóng chat ở góc màn hình sẽ tải lại theo. Khi đã ưng ý, hãy sao chép mã nhúng. ' +
        'Một máy chủ mô phỏng chạy ngay trong trình duyệt sẽ trả lời, nên không có dữ liệu nào được gửi đi, trừ khi bạn nhập webhook của riêng mình. ' +
        'Xem thêm <a href="guest-form.html">ví dụ về biểu mẫu khách</a>.',
      language: 'Ngôn ngữ',
      languageHint: 'Đặt ngôn ngữ cho khung chat và cho trang này. Tự động sẽ theo trình duyệt.',
      text: 'Nội dung',
      title: 'Tiêu đề',
      subtitle: 'Tiêu đề phụ',
      greeting: 'Lời chào',
      greetingHint: 'Hỗ trợ **đậm**, *nghiêng*, danh sách và liên kết. Nhập off để ẩn lời chào. Để trống ô nội dung để dùng câu có sẵn của ngôn ngữ.',
      tooltip: 'Bong bóng gợi ý',
      tooltipHint: 'Bong bóng hiện phía trên nút chat khi khung chat đang đóng. Để trống: không hiện.',
      placeholder: 'Gợi ý trong ô nhập',
      suggestions: 'Gợi ý câu hỏi',
      suggestionsHint: 'Tối đa 6 nút, cách nhau bằng <code>|</code>.',
      look: 'Giao diện',
      accent: 'Màu chủ đạo',
      accentPick: 'Chọn màu chủ đạo',
      position: 'Vị trí',
      left: 'Trái',
      right: 'Phải',
      theme: 'Chế độ màu',
      auto: 'Tự động',
      light: 'Sáng',
      dark: 'Tối',
      behavior: 'Hành vi',
      open: 'Mở khung chat khi tải trang',
      typewriter: 'Hiện câu trả lời theo kiểu gõ chữ',
      guestForm: 'Bắt buộc điền biểu mẫu khách trước khi chat',
      consentText: 'Nội dung đồng ý',
      backend: 'Máy chủ',
      webhook: 'URL webhook',
      webhookPlaceholder: 'Để trống: dùng máy chủ mô phỏng',
      webhookMock: 'Máy chủ mô phỏng trả lời ngay trong trình duyệt.',
      webhookOk: 'Tin nhắn được gửi đến webhook này. Webhook phải cho phép nguồn (origin) của trang này.',
      webhookBad: 'URL phải bắt đầu bằng https://. Trang vẫn dùng máy chủ mô phỏng cho đến khi URL hợp lệ.',
      contentType: 'Kiểu nội dung',
      contentJson: 'json (application/json)',
      contentText: 'text (text/plain, không có CORS preflight)',
      reset: 'Đặt lại tùy chọn',
      embedCode: 'Mã nhúng',
      embedStyle: 'Kiểu mã nhúng',
      tabTag: 'Thẻ script',
      copy: 'Sao chép',
      copied: 'Đã sao chép',
      copyManual: 'Hãy chọn và sao chép',
      codeNote: 'Thay <code>src</code> bằng nơi bạn lưu tệp. Chỉ những tùy chọn khác mặc định mới được liệt kê.',
      tryTitle: 'Thử ngay',
      tryText: 'Với máy chủ mô phỏng, hãy hỏi về <code>giá</code> để nhận các nút trả lời nhanh, hoặc gửi <code>markdown</code> để xem định dạng. ' +
        'Các từ sau làm yêu cầu thất bại để bạn xem trạng thái lỗi: <code>error</code> (500), <code>bad</code> (400), ' +
        '<code>rate</code> (429), <code>slow</code> (hết thời gian chờ sau 6 giây) và <code>offline</code> (lỗi mạng).',
      apiTitle: 'API JavaScript',
      eventsLabel: 'Sự kiện từ <code>FlowBubble.on(…)</code>, mới nhất ở trên:',
      sendExample: 'Giờ mở cửa của bạn thế nào?',
      startSuggestions: 'Bảng giá|Liên hệ|Giờ mở cửa|markdown',
      widget: {
        title: 'Hỗ trợ',
        subtitle: 'Thường trả lời ngay',
        greeting: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay?',
        placeholder: 'Nhập tin nhắn…',
        consentText: 'Tôi đồng ý cho lưu họ tên và thông tin liên hệ của tôi để đội ngũ liên hệ về yêu cầu của tôi.'
      }
    }
  };

  var form = document.getElementById('options');
  var codeEl = document.getElementById('code');
  var hint = document.getElementById('webhook-hint');
  var accentColor = document.getElementById('accent-color');
  var copyButton = document.getElementById('copy');
  var mode = 'js';
  var locale = 'en';
  var panelOpen = false;
  var mounted = false;
  var timer = 0;

  /* ---- language ---- */

  // "auto" follows the browser, like the widget does. Unknown languages fall back to English.
  function resolveLocale(lang) {
    var code = String(lang === 'auto' ? navigator.language : lang).toLowerCase().split(/[-_]/)[0];
    return PAGE[code] ? code : 'en';
  }

  function startState() {
    return Object.assign({ webhook: '' }, WIDGET_DEFAULTS, { suggestions: PAGE[locale].startSuggestions });
  }

  // Translates the page. The strings are the static ones above, so innerHTML is safe here.
  function translatePage() {
    var t = PAGE[locale];
    document.documentElement.lang = locale;
    document.title = t.heading;
    document.querySelectorAll('[data-i18n]').forEach(function (node) { node.textContent = t[node.dataset.i18n]; });
    document.querySelectorAll('[data-i18n-html]').forEach(function (node) { node.innerHTML = t[node.dataset.i18nHtml]; });
    document.querySelectorAll('[data-i18n-aria]').forEach(function (node) { node.setAttribute('aria-label', t[node.dataset.i18nAria]); });
    Object.keys(t.widget).forEach(function (key) { form.elements[key].placeholder = t.widget[key]; });
    form.elements.webhook.placeholder = t.webhookPlaceholder;
  }

  /* ---- state <-> form <-> URL ---- */

  function fromHash() {
    var params = new URLSearchParams(location.hash.slice(1));
    locale = resolveLocale(params.get('lang') || 'auto');
    var state = startState();
    KEYS.forEach(function (k) { if (params.has(k)) state[k] = params.get(k); });
    return state;
  }

  function toHash(state) {
    var start = startState();
    var params = new URLSearchParams();
    KEYS.forEach(function (k) { if (state[k] !== start[k]) params.set(k, state[k]); });
    var hash = params.toString();
    history.replaceState(null, '', hash ? '#' + hash : location.pathname + location.search);
  }

  function fillForm(state) {
    KEYS.forEach(function (k) {
      var field = form.elements[k];
      if (CHECKBOXES[k]) field.checked = state[k] === CHECKBOXES[k][0];
      else field.value = state[k]; // also selects the matching radio
    });
    syncAccent();
  }

  function readForm() {
    var state = {};
    KEYS.forEach(function (k) {
      var field = form.elements[k];
      state[k] = CHECKBOXES[k] ? CHECKBOXES[k][field.checked ? 0 : 1] : String(field.value).trim();
    });
    return state;
  }

  function validHex(v) { return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v); }

  function syncAccent() {
    var v = form.elements.accent.value.trim();
    if (!validHex(v)) return;
    if (v.length === 4) v = '#' + v.slice(1).replace(/./g, '$&$&');
    accentColor.value = v.toLowerCase();
  }

  function validWebhook(url) {
    try {
      var u = new URL(url);
      return u.protocol === 'https:' || (u.protocol === 'http:' && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(u.hostname));
    } catch (e) { return false; }
  }

  /* ---- embed code ---- */

  function changed(state) {
    return KEYS.filter(function (k) { return k !== 'webhook' && state[k] !== WIDGET_DEFAULTS[k]; });
  }

  function jsString(v) {
    return "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r?\n/g, '\\n').replace(/<\/script/gi, '<\\/script') + "'";
  }

  function attr(v) {
    return '"' + v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') + '"';
  }

  function dataName(key) {
    return 'data-' + key.replace(/[A-Z]/g, function (c) { return '-' + c.toLowerCase(); });
  }

  function buildCode(state, webhook) {
    var keys = changed(state);
    if (mode === 'tag') {
      return ['<script', '  src=' + attr(SNIPPET_SRC), '  data-webhook=' + attr(webhook)]
        .concat(keys.map(function (k) { return '  ' + dataName(k) + '=' + attr(state[k]); }))
        .concat(['  defer></script>'])
        .join('\n');
    }
    return ['<script>', '(function () {', "  var s = document.createElement('script');",
      '  s.src = ' + jsString(SNIPPET_SRC) + ';', '  s.dataset.webhook = ' + jsString(webhook) + ';']
      .concat(keys.map(function (k) { return '  s.dataset.' + k + ' = ' + jsString(state[k]) + ';'; }))
      .concat(['  document.body.appendChild(s);', '})();', '</script>'])
      .join('\n');
  }

  /* ---- the widget ---- */

  // The widget reads its options once, when its script runs. To apply new options the playground
  // removes the widget and loads the script again. A real page only needs to do this once.
  function mount(state, webhook) {
    var old = document.querySelector('flow-bubble');
    if (old) old.remove();
    var oldScript = document.getElementById('flowbubble-script');
    if (oldScript) oldScript.remove();
    delete window.FlowBubble;

    var s = document.createElement('script');
    s.id = 'flowbubble-script';
    s.src = WIDGET_SRC;
    s.dataset.webhook = webhook;
    // Empty text options and lang "auto" are left out, so the widget uses its own defaults.
    changed(state).forEach(function (k) { s.dataset[k] = state[k]; });
    if (mounted && panelOpen) s.dataset.open = 'true'; // keep the panel open across reloads
    s.dataset.storageKey = 'flowbubble-example';
    // The tooltip shows once per browser session. Show it again after each change of options.
    try { sessionStorage.removeItem('flowbubble-example:tip'); } catch (e) { /* storage blocked */ }
    if (webhook === FlowBubbleMock.url) s.dataset.timeout = '6000';
    s.onload = function () {
      panelOpen = s.dataset.open === 'true';
      FlowBubble.on('open', function () { panelOpen = true; });
      FlowBubble.on('close', function () { panelOpen = false; });
      logFlowBubbleEvents();
      mounted = true;
    };
    document.body.appendChild(s);
  }

  function update(remount) {
    var state = readForm();

    // A language switch retranslates the page and swaps the starter suggestions if they are untouched.
    var next = resolveLocale(state.lang);
    if (next !== locale) {
      if (state.suggestions === PAGE[locale].startSuggestions) {
        state.suggestions = form.elements.suggestions.value = PAGE[next].startSuggestions;
      }
      locale = next;
      translatePage();
    }
    var t = PAGE[locale];

    document.getElementById('consent-field').hidden = state.guestForm !== 'required';

    var custom = state.webhook !== '';
    var ok = custom && validWebhook(state.webhook);
    hint.className = custom && !ok ? 'warn' : '';
    hint.textContent = !custom ? t.webhookMock : ok ? t.webhookOk : t.webhookBad;

    FlowBubbleMock.requireGuest = state.guestForm === 'required';
    toHash(state);
    codeEl.textContent = buildCode(state, ok ? state.webhook : SNIPPET_WEBHOOK);
    if (!remount) return;
    clearTimeout(timer);
    timer = setTimeout(function () { mount(state, ok ? state.webhook : FlowBubbleMock.url); }, mounted ? 350 : 0);
  }

  /* ---- wiring ---- */

  form.addEventListener('input', function (e) {
    if (e.target === accentColor) form.elements.accent.value = accentColor.value.toUpperCase();
    else syncAccent();
    update(true);
  });
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  document.getElementById('reset-options').addEventListener('click', function () {
    var lang = form.elements.lang.value; // the language choice survives a reset
    fillForm(Object.assign(startState(), { lang: lang }));
    update(true);
  });

  [['tab-js', 'js'], ['tab-tag', 'tag']].forEach(function (pair) {
    document.getElementById(pair[0]).addEventListener('click', function () {
      mode = pair[1];
      document.getElementById('tab-js').setAttribute('aria-selected', String(mode === 'js'));
      document.getElementById('tab-tag').setAttribute('aria-selected', String(mode === 'tag'));
      update(false);
    });
  });

  copyButton.addEventListener('click', function () {
    var done = function (key) {
      copyButton.textContent = PAGE[locale][key];
      setTimeout(function () { copyButton.textContent = PAGE[locale].copy; }, 1500);
    };
    if (!navigator.clipboard) return done('copyManual');
    navigator.clipboard.writeText(codeEl.textContent).then(function () { done('copied'); }, function () { done('copyManual'); });
  });

  document.getElementById('api').addEventListener('click', function (e) {
    var action = e.target.dataset && e.target.dataset.api;
    if (!action || !window.FlowBubble) return;
    if (action === 'send') FlowBubble.send(PAGE[locale].sendExample);
    else FlowBubble[action]();
  });

  var initial = fromHash();
  translatePage();
  fillForm(initial);
  update(true);
})();
