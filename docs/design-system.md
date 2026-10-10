# PitStop — Design System & Visual Specification

## 1. Brand Identity & Design Principles

**Brand Name**: PitStop  
**Tagline**: *"Every rider deserves a place to stop."*  
**Visual Style**: Clean, organized, trustworthy, and modern Indian startup aesthetic. White surfaces with carefully placed PitStop Yellow accents. Restrained, professional e-commerce-level usability.

### Core Principles
1. **Utility First**: Clear, legible, high-contrast UI designed for quick scanning on mobile screens in direct sunlight.
2. **Restrained Yellow Usage**: PitStop Yellow (`#F7B928`) is reserved for primary actions, key active navigation states, verified badges, and high-priority callouts. Cards and containers remain clean white with subtle borders.
3. **Subtle Elevation & Radius**: Medium rounded corners (`8px` to `12px`), light borders (`#E3E5E8`), and minimal ambient shadows. No heavy gradients or distracting glassmorphism.
4. **Touch-Friendly Controls**: Minimum touch target size of `44x44px` on mobile screens for easy access while wearing riding gloves or holding a phone in hand.

---

## 2. Color System Tokens

### 2.1 Brand Palette
| Token Name | Hex Code | HSL / RGB | Usage Description |
| :--- | :--- | :--- | :--- |
| `color-primary` | `#F7B928` | `hsl(42, 92%, 56%)` | Primary brand yellow. Action buttons, active badges, highlights. |
| `color-primary-dark` | `#D99B10` | `hsl(42, 86%, 46%)` | Hover & focus state for primary buttons. |
| `color-primary-light`| `#FEF5DC` | `hsl(42, 92%, 93%)` | Soft yellow tint background for active items / alerts. |
| `color-main-bg` | `#FFFFFF` | `hsl(0, 0%, 100%)` | Main surface background for cards, modals, headers. |
| `color-page-bg` | `#F4F6F8` | `hsl(210, 20%, 96%)` | Overall page backdrop color. |
| `color-text-main` | `#202124` | `hsl(225, 6%, 13%)` | Charcoal primary text (headings, body titles). |
| `color-text-muted` | `#686868` | `hsl(0, 0%, 41%)` | Muted gray secondary text (subtitles, meta info). |
| `color-border` | `#E3E5E8` | `hsl(216, 12%, 91%)` | Subtle divider and card border line. |

### 2.2 Semantic Status Palette
| Token Name | Hex Code | Usage Description |
| :--- | :--- | :--- |
| `color-success` | `#10B981` | Rest-stop "Available" state, verified check-ins, job accepted. |
| `color-warning` | `#F59E0B` | Rest-stop "Busy" state, pending applications, expiring deals. |
| `color-danger` | `#EF4444` | Rest-stop "Full/Closed" state, rejected applications, error alerts. |
| `color-info` | `#3B82F6` | Informational badges, platform announcements. |

---

## 3. Design Token Specification (Code Format)

### 3.1 CSS Custom Properties (`styles/tokens.css`)
```css
:root {
  /* Brand Palette */
  --pitstop-yellow: #F7B928;
  --pitstop-yellow-dark: #D99B10;
  --pitstop-yellow-light: #FEF5DC;
  
  --pitstop-bg-main: #FFFFFF;
  --pitstop-bg-page: #F4F6F8;
  
  --pitstop-text-primary: #202124;
  --pitstop-text-secondary: #686868;
  --pitstop-border: #E3E5E8;

  /* Semantic Palette */
  --pitstop-success: #10B981;
  --pitstop-warning: #F59E0B;
  --pitstop-danger: #EF4444;
  --pitstop-info: #3B82F6;

  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-subtle: 0 1px 3px rgba(32, 33, 36, 0.06), 0 1px 2px rgba(32, 33, 36, 0.04);
  --shadow-card: 0 4px 6px -1px rgba(32, 33, 36, 0.06), 0 2px 4px -1px rgba(32, 33, 36, 0.03);
  --shadow-elevation: 0 10px 15px -3px rgba(32, 33, 36, 0.08), 0 4px 6px -2px rgba(32, 33, 36, 0.04);
}
```

### 3.2 Tailwind Config Token Integration (`tailwind.config.js`)
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        pitstop: {
          yellow: '#F7B928',
          'yellow-dark': '#D99B10',
          'yellow-light': '#FEF5DC',
          charcoal: '#202124',
          muted: '#686868',
          border: '#E3E5E8',
          bg: '#F4F6F8',
        }
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(32, 33, 36, 0.06), 0 1px 2px rgba(32, 33, 36, 0.04)',
        card: '0 4px 6px -1px rgba(32, 33, 36, 0.06), 0 2px 4px -1px rgba(32, 33, 36, 0.03)',
      }
    }
  }
};
```

---

## 4. Typography Scale

Font Stack: `Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`

| Typography Level | Size (px / rem) | Weight | Line Height | Recommended Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Heading 1` | `32px / 2rem` | Bold (700) | `1.2` | Hero title, Page titles |
| `Heading 2` | `24px / 1.5rem` | SemiBold (600) | `1.3` | Section headings, Modal titles |
| `Heading 3` | `18px / 1.125rem` | SemiBold (600) | `1.4` | Card titles, Subsections |
| `Body Base` | `16px / 1rem` | Regular (400) | `1.5` | Default body text, Form inputs |
| `Body Small` | `14px / 0.875rem` | Medium (500) | `1.4` | Meta labels, secondary text |
| `Caption / Badge`| `12px / 0.75rem` | SemiBold (600) | `1.3` | Status badges, timestamp tags |

---

## 5. Component Design Standards

### 5.1 Primary Button (`Button`)
- **Background**: `#F7B928`
- **Text Color**: `#202124` (Charcoal, Font Weight 600)
- **Hover State**: `#D99B10`
- **Border Radius**: `8px` (`rounded-md`)
- **Padding**: `12px 20px` (`py-3 px-5` on desktop, min height `44px` on mobile).
- **Focus Ring**: `2px solid #F7B928` with `2px offset`.

### 5.2 Rest-Stop & Job Cards (`Card`)
- **Background**: `#FFFFFF`
- **Border**: `1px solid #E3E5E8`
- **Border Radius**: `12px` (`rounded-lg`)
- **Shadow**: `--shadow-subtle`
- **Hover Effect**: Subtle translate-y `-2px` with elevated shadow `--shadow-card`. No dramatic yellow glow.

### 5.3 Facility Badges (`Badge`)
- **Background**: `#F4F6F8` (Soft Gray)
- **Border**: `1px solid #E3E5E8`
- **Text Color**: `#202124`
- **Active / Verified Accent**: Icon prefix with `#F7B928` tint or status color.

---

## 6. Responsive Breakpoint Specification

- **Small Smartphone (320px – 479px)**:
  - Single column layouts.
  - Sticky bottom navigation bar for quick rider actions.
  - Compact header with logo and burger menu drawer.
- **Large Smartphone (480px – 767px)**:
  - 1 to 2 column grid cards.
  - Expanded filter modal dialogs.
- **Tablet (768px – 1023px)**:
  - 2 column card layouts.
  - Side-by-side list and map toggle.
- **Desktop (1024px – 1439px)**:
  - 3 column grid layouts.
  - Persistent left sidebar for authenticated rider/merchant dashboards.
- **Wide Desktop (1440px+)**:
  - Max container width capped at `1280px` (`max-w-7xl`) centered with auto margins.
