# SPQA Roman Theme

## Overview

This is the default Roman Republic-themed skin for SPQA Dashboard. It maps internal role identifiers to Roman-inspired display names, emojis, colors, and organizational tiers.

## Role Mapping System

The theme system translates abstract roles into user-facing properties:

| Internal ID | Display Name | Emoji | Tier | Purpose |
|---|---|---|---|---|
| `caesar` | Caesar (凯撒) | 🏛 | supreme | Primary decision-maker (you) |
| `consul` | Consul (执政官) | ⚜️ | always-on | Primary assistant, task orchestrator |
| `praetor` | Praetor (裁判官) | ⚖️ | skill | Topic analysis, filtering |
| `senator` | Senator (元老) | 🏛 | ephemeral | Collective wisdom, multi-perspective decisions |
| `legionary` | Legionarius (军团兵) | ⚔️ | ephemeral | Temporary executor |
| `annalist` | Annalista (史官) | 📚 | always-on | Memory manager, archiving |
| `curator` | Curator Aquarum (水道官) | 🌊 | always-on | Infrastructure, costs, health |
| `quaestor` | Quaestor (财务官) | 💰 | optional | Finance management |
| `explorator` | Explorator (探路者) | 🔍 | optional | Intelligence, trends, monitoring |
| `mercenary` | Mercenarius (佣兵) | 🗡️ | external | External contractors |
| `praetorian` | Praetorianus (禁卫军) | 🛡️ | project-persistent | Caesar's direct team, persistent projects |
| `configurator` | Praefectus Fabrum (工程长) | 🔧 | system | System configuration |

## Creating a Custom Theme

1. **Copy this directory:**
   ```bash
   cp -r spqa-roman spqa-custom-name
   ```

2. **Edit `theme.yaml`:**
   - Update `meta` section (name, version, author, description)
   - Modify the `palette` colors
   - Customize role names, emojis, descriptions, and colors
   - Reorder `sidebar_order` if needed

3. **Keep the structure:** Maintain all required roles and tier definitions to avoid dashboard breaks.

4. **Register your theme:** Add your theme directory to SPQA's theme registry.

## Theme Files

- `theme.yaml` - Theme configuration and role mappings
- `README.md` - This file

## Customization Tips

- **Colors:** Use hex format (`#RRGGBB`) for all color values
- **Emojis:** Any Unicode emoji is supported
- **Tier ordering:** Lower `order` values appear first in the dashboard
- **Descriptions:** Keep descriptions concise (under 80 characters recommended)
