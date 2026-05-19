# 🌿 Renson Camargue Pergola Card

> **This integration was fully generated with [Claude](https://claude.ai) by Anthropic.**

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/hacs/integration)
[![Default](https://img.shields.io/badge/Default-Integration-blue.svg?style=for-the-badge&logo=homeassistant&logoColor=white)](https://www.home-assistant.io)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Andries%20Muylaert-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/AndriesMuylaert)

A Home Assistant Lovelace custom card for the **Renson Camargue** pergola, using the [OverKiz](https://www.home-assistant.io/integrations/overkiz/) integration.

## Features

- **Live SVG visual** of the pergola: louvres animate based on actual tilt %, screens drop to their real position, LED panels glow when on.
- **Roof louvres** — open tilt / My (stop) / close tilt with live % readout.
- **Screen left & right** — open / My (stop) / close with live % readout.
- **LED left & right** — on / My (preferred position) / off buttons, plus a position slider (`number` entity) with live readout.
- Fully dark-themed, designed to blend with modern HA dashboards.

## Preview

> The card renders a simplified front-perspective SVG of the Camarque structure. Louvre angle, screen drop level, and LED glow all update in real time.

## Installation

### Via HACS (recommended)

1. Open **HACS → Frontend**.
2. Click the **⋮ menu → Custom repositories**.
3. Add `https://github.com/AndriesMuylaert/Outdoor-living` with category **Lovelace**.
4. Find **Renson Camargue Pergola Card** and click **Download**.
5. Reload your browser.

### Manual

1. Download `renson-pergola-card.js` from the [latest release](https://github.com/AndriesMuylaert/outdoor-living/releases).
2. Copy it to `config/www/renson-pergola-card.js`.
3. In HA → **Settings → Dashboards → Resources**, add:
   ```
   /local/renson-pergola-card.js   (JavaScript module)
   ```
4. Reload your browser.

## Configuration

Add a card in Lovelace with type `custom:renson-pergola-card`:

```yaml
type: custom:renson-pergola-card
name: Renson Camargue     # optional, default "Renson Camargue"
roof_cover: cover.camargue_roof
screen_left: cover.camargue_screen_left
screen_right: cover.camargue_screen_right
led_left: light.camargue_led_left
led_right: light.camargue_led_right
led_left_slider: number.camargue_led_li_my_position
led_right_slider: number.camargue_led_rec_my_position
led_left_button: button.camargue_led_li_my_position
led_right_button: button.camargue_led_rec_my_position
```

### Entity IDs with OverKiz

OverKiz entity IDs are auto-generated from the device names you configured in the Somfy/Renson app. Open **Developer Tools → States** and search for your devices to find the exact IDs. Common patterns:

| Device | Typical entity ID |
|---|---|
| Roof (louvres) | `cover.camargue_roof` |
| Left screen | `cover.camargue_screen_left` |
| Right screen | `cover.camargue_screen_right` |
| LED left | `light.camargue_led_left` |
| LED right | `light.camargue_led_right` |
| LED left position (number) | `number.camargue_led_li_my_position` |
| LED right position (number) | `number.camargue_led_rec_my_position` |
| LED left My button | `button.camargue_led_li_my_position` |
| LED right My button | `button.camargue_led_rec_my_position` |

## Controls reference

| Control | Open/On | Stop (My) | Close/Off |
|---|---|---|---|
| Roof | `cover.open_cover_tilt` | `cover.stop_cover_tilt` | `cover.close_cover_tilt` |
| Screens | `cover.open_cover` | `cover.stop_cover` | `cover.close_cover` |
| LEDs | `light.turn_on` | `button.press` (My position) | `light.turn_off` |
| LED position | `number.set_value` via slider | — | — |

The **My** button sends the OverKiz "preferred position" stop command — works if you have a My position programmed in the Renson / Somfy app.

## Visual status levels

The SVG renders snapped visual positions at 0 / 25 / 50 / 75 / 100 %, while the readout always shows the precise value reported by HA.

## Requirements

- Home Assistant **2023.1** or newer
- [OverKiz](https://www.home-assistant.io/integrations/overkiz/) integration configured
- Renson Camarque connected via Somfy TaHoma / OverKiz hub

## Credits

This integration was fully generated with **[Claude](https://claude.ai)** by [Anthropic](https://www.anthropic.com).

## License

MIT
