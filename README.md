# Hikvision Doorbell Card

Custom Lovelace card for WebRTC two-way audio with Hikvision doorbells.

![Hikvision Doorbell Card](@hikvision-doorbell-card/card-screenshot.png)

## Features

- **One-click two-way audio** - Start talking with a single button press
- **Integrated video display** - Built on Advanced Camera Card for live streaming
- **Custom elements support** - Add overlays and controls from Advanced Camera Card
- **Visual feedback** - Status indicators and connection state display

## Requirements

- [Hikvision Doorbell Integration](https://github.com/acardace/hikvision-doorbell-integration) installed in Home Assistant
- [hikvision-doorbell-server](https://github.com/acardace/hikvision-doorbell-server) running and accessible
- [Advanced Camera Card](https://github.com/dermotduffy/advanced-camera-card) installed in Home Assistant
- Home Assistant accessible via HTTPS (required for browser microphone access)

## Installation

### HACS (Recommended)

1. Add this repository as a custom repository in HACS:
   - Go to HACS → Frontend
   - Click the three dots menu → Custom repositories
   - Add `https://github.com/acardace/hikvision-doorbell-card`
   - Category: Lovelace
2. Click Install
3. Restart Home Assistant

### Manual

1. Download `hikvision-doorbell-card.js`
2. Copy it to `config/www/hikvision-doorbell-card.js`
3. Add the resource in Home Assistant:
   - Go to Settings → Dashboards → Resources
   - Click "Add Resource"
   - URL: `/local/hikvision-doorbell-card.js`
   - Resource type: JavaScript Module
4. Restart Home Assistant

## Usage

### Basic Configuration

```yaml
type: custom:hikvision-doorbell-card
entity: camera.doorbell
```

### With Custom Elements

The card supports custom elements from the Advanced Camera Card:

```yaml
type: custom:hikvision-doorbell-card
entity: camera.doorbell
elements:
  - type: state-label
    entity: sensor.doorbell_battery
    style:
      top: 10px
      left: 10px
      color: white
      font-size: 14px
  - type: icon
    icon: mdi:bell
    tap_action:
      action: call-service
      service: button.press
      service_data:
        entity_id: button.doorbell_ring
    style:
      top: 10px
      right: 10px
      color: white
```

### How It Works

1. Click the microphone button to start talking
2. Allow microphone access when prompted by the browser
3. Wait for WebRTC connection
4. Speak through your microphone - you'll hear audio from the doorbell in real-time
5. Click the hang-up button to stop

## Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `entity` | string | Yes | Camera entity ID from the Hikvision Doorbell integration |
| `name` | string | No | Card title (defaults to entity friendly name) |
| `elements` | array | No | Custom elements from Advanced Camera Card |

## Troubleshooting

### Microphone access denied

Ensure Home Assistant is accessible via HTTPS. Browsers require HTTPS for microphone access (except on localhost).

### Connection fails

- Check that the hikvision-doorbell-server is running and accessible
- Verify the integration is configured correctly
- Check browser console (F12) for errors

### No audio from doorbell

- Check browser audio isn't muted
- Verify the go2rtc stream works in the Advanced Camera Card

## License

Apache License 2.0
