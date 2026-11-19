// Playground for example/index.html: reads the options form, (re)loads the widget with them,
// and prints the matching embed code. Example pages only, not part of the widget.
(function () {
  var WIDGET_SRC = '../flowbubble.min.js';
  var SNIPPET_SRC = 'https://your-cdn.com/flowbubble.v0.1.0.js';
  var SNIPPET_WEBHOOK = 'https://your-flowapp-host/api/automation-webhooks/<automation-id>';

  // The widget's own defaults. The embed code leaves out options that still have these values.
  var WIDGET_DEFAULTS = {
    title: 'Support',
    subtitle: 'Typically replies instantly',
    greeting: 'Hi! How can I help you today?',
    placeholder: 'Type a message…',
    suggestions: '',
    accent: '#6C5CE7',
    position: 'right',
    theme: 'auto',
    open: 'false',
    typewriter: 'true',
    guestForm: 'off',
    consentText: 'I agree that my name and contact details are stored so the team can contact me about my request.',
    contentType: 'json'
  };
  // What the playground starts with.
  var START = Object.assign({}, WIDGET_DEFAULTS, {
    greeting: 'Hi! I am the **demo bot**. How can I help you today?',
    suggestions: 'Pricing|Contact|Opening hours|markdown',
    webhook: ''
  });
  var KEYS = Object.keys(START);
  var CHECKBOXES = { open: ['true', 'false'], typewriter: ['true', 'false'], guestForm: ['required', 'off'] };

  var form = document.getElementById('options');
  var codeEl = document.getElementById('code');
  var hint = document.getElementById('webhook-hint');
  var accentColor = document.getElementById('accent-color');
  var mode = 'js';
  var panelOpen = false;
  var mounted = false;
  var timer = 0;

  /* ---- state <-> form <-> URL ---- */

  function fromHash() {
    var state = Object.assign({}, START);
    var params = new URLSearchParams(location.hash.slice(1));
    KEYS.forEach(function (k) { if (params.has(k)) state[k] = params.get(k); });
    return state;
  }

  function toHash(state) {
    var params = new URLSearchParams();
    KEYS.forEach(function (k) { if (state[k] !== START[k]) params.set(k, state[k]); });
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
    KEYS.forEach(function (k) { if (k !== 'webhook') s.dataset[k] = state[k]; });
    if (mounted && panelOpen) s.dataset.open = 'true'; // keep the panel open across reloads
    s.dataset.storageKey = 'flowbubble-example';
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
    document.getElementById('consent-field').hidden = state.guestForm !== 'required';

    var custom = state.webhook !== '';
    var ok = custom && validWebhook(state.webhook);
    hint.className = custom && !ok ? 'warn' : '';
    hint.textContent = !custom ? 'The mock answers in your browser.'
      : ok ? 'Messages are sent to this webhook. It has to allow this page\'s origin.'
      : 'This has to be an https:// URL. The mock is used until it is.';

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
    fillForm(START);
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

  document.getElementById('copy').addEventListener('click', function () {
    var button = this;
    var done = function (label) {
      button.textContent = label;
      setTimeout(function () { button.textContent = 'Copy'; }, 1500);
    };
    if (!navigator.clipboard) return done('Select and copy');
    navigator.clipboard.writeText(codeEl.textContent).then(function () { done('Copied'); }, function () { done('Select and copy'); });
  });

  fillForm(fromHash());
  update(true);
})();
