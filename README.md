# FlowBubble (release builds)

Built files of the FlowBubble chat widget: one zero-dependency vanilla JS file (about 11 KB gzipped) that adds a chatbox to any page and talks to a FLOWAPP webhook. The widget renders inside a Shadow DOM, so the host page's CSS can't break it.

## Files

| File | Use |
|---|---|
| `flowbubble.v0.1.0.js` | Versioned build. Cache it long-term (`Cache-Control: public, max-age=31536000, immutable`). |
| `flowbubble.min.js` | The latest build, same content. Use a short cache time if you serve it. |

Each version is also a [GitHub release](../../releases) with the files attached.

SRI hash of `flowbubble.v0.1.0.js`:

```
sha384-iRB2Y1qmANIGHXRKwdlnH4XgVpnG/iTGPxlCH+z0+/abGyxJbwYI2BzB53F/+4RX
```

## Example

The [`example/`](example) folder has two pages you can open without a backend. A mock (`example/mock-backend.js`) answers the widget in the browser, so nothing is sent anywhere.

| Page | Shows |
|---|---|
| [`example/index.html`](example/index.html) | The basic embed, quick-reply chips, Markdown, the error states and the JavaScript API with a live event log. |
| [`example/guest-form.html`](example/guest-form.html) | The pre-chat guest form (`data-guest-form="required"`) and the `guest_required` gate. |

```sh
git clone https://github.com/flixmee/flowbubble-dist.git
cd flowbubble-dist
npx serve .        # or: python3 -m http.server 8000
# then open /example/
```

`mock-backend.js` also documents the request and response shapes your own webhook has to follow.

## Embed

```html
<script
  src="https://your-cdn.com/flowbubble.v0.1.0.js"
  integrity="sha384-iRB2Y1qmANIGHXRKwdlnH4XgVpnG/iTGPxlCH+z0+/abGyxJbwYI2BzB53F/+4RX"
  crossorigin="anonymous"
  data-webhook="https://your-flowapp-host/api/automation-webhooks/<automation-id>"
  data-title="Support"
  data-greeting="Hi! How can I help you today?"
  data-suggestions="Pricing|Contact|Opening hours"
  data-accent="#6C5CE7"
  defer></script>
```

`integrity` and `crossorigin` are optional. If you use them, the CDN has to send `Access-Control-Allow-Origin`.

### Load from JavaScript

You can also create the script element yourself, for example from a tag manager or after a consent banner. Each `data-*` option becomes a `dataset` property in camelCase (`data-guest-form` → `dataset.guestForm`). The example pages load the widget this way.

```html
<script>
(function () {
  var s = document.createElement('script');
  s.src = 'https://your-cdn.com/flowbubble.v0.1.0.js';
  s.dataset.webhook = 'https://your-flowapp-host/api/automation-webhooks/<automation-id>';
  s.dataset.title = 'Support';
  s.dataset.greeting = 'Hi! How can I help you today?';
  s.dataset.suggestions = 'Pricing|Contact|Opening hours';
  s.dataset.accent = '#6C5CE7';
  s.onload = function () {
    // window.FlowBubble is ready here
    FlowBubble.on('reply', function (e) { console.log(e.text); });
  };
  document.body.appendChild(s);
})();
</script>
```

## Options

| Attribute | Default | Notes |
|---|---|---|
| `data-webhook` | (required) | Must be `https://`. `http://localhost` is allowed for development. |
| `data-title` / `data-subtitle` | `Support` / `Typically replies instantly` | Header text. |
| `data-greeting` | `Hi! How can I help you today?` | First bot bubble. Supports Markdown-lite. |
| `data-placeholder` | `Type a message…` | Composer placeholder. |
| `data-suggestions` | none | Chips under the greeting, separated by `\|`. Up to 6. Replies can add their own chips; see [Quick replies](#quick-replies). |
| `data-accent` | `#6C5CE7` | Hex color. |
| `data-position` | `right` | `right` or `left`. |
| `data-theme` | `auto` | `auto`, `light` or `dark`. |
| `data-content-type` | `json` | `text` sends `text/plain`, which skips the CORS preflight. |
| `data-timeout` | `30000` | Request timeout in ms. The minimum is 5000. |
| `data-typewriter` | `true` | Word-by-word reveal of replies. It is always off under reduced motion. |
| `data-storage-key` | `flowbubble` | `localStorage` namespace. Change it to run two widgets on one origin. |
| `data-open` | `false` | Open the panel on load. |
| `data-lang` | browser language | Sent as `lang`. |
| `data-z-index` | `2147483000` | |
| `data-guest-form` | `off` | `required` shows a pre-chat form (name and phone required, email optional, consent checkbox). Chat stays locked until it is submitted. |
| `data-consent-text` | "I agree that my name and contact details are stored…" | Consent label. The text is stored with the lead. |

You can also set `window.FlowBubbleConfig = { webhook: "...", ... }` before the script loads. `data-*` attributes take precedence over it.

### JavaScript API

```js
FlowBubble.open(); FlowBubble.close(); FlowBubble.toggle();
FlowBubble.send("What are your prices?"); // opens the panel and sends
FlowBubble.reset();                       // new session, clears the thread
const off = FlowBubble.on("reply", ({ text, options, sessionId }) => {});
FlowBubble.on("quickreply", ({ text, index }) => {}); // a quick-reply chip was clicked
// events: ready, open, close, register, send, reply, quickreply, error, reset
```

### Quick replies

A reply can end with one marker line, and the widget turns it into tappable chips under that message:

```
Which plan are you interested in?
[[QUICK: Starter | Pro | Enterprise]]
```

The marker only counts when it is the last non-whitespace content of the reply. Anywhere else it is shown as plain text. The widget strips it before rendering, and keeps at most 4 unique options (case-insensitive) of up to 40 characters each. Only the latest bot message shows chips, and they go away as soon as the visitor sends anything. Clicking a chip sends its text like a typed message. If that send fails, the chips come back. The `reply` event's `text` comes without the marker, and `options` holds the parsed chips (`[]` when there are none).

