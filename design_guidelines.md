# Undifest Event Platform - Design Guidelines

## Design Approach
**Exact Design Replication**: Match all provided mockups pixel-perfect. This is a brand-specific design with established visual identity - no creative interpretation needed.

## Typography
**Font Family**: Rajdhani (Google Fonts fallback since TTF files provided)
- Headings: Rajdhani Bold (700)
- Subheadings: Rajdhani SemiBold (600)
- Body text: Rajdhani Medium (500)
- Secondary text: Rajdhani Regular (400)
- Light text: Rajdhani Light (300)

## Color Palette
- **Background**: #0a1621 (dark navy)
- **Purple Gradient**: #8B2FC9 → #FF1493
- **Cyan Accent**: #00D4FF
- **Gold CTA**: #FFB800
- **Holographic Gradient**: Rainbow spectrum for premium buttons
- **Red Border**: For food event cards
- **Blue Border**: For other event cards
- **Status Colors**: Green (Aktif), Gray (Selesai), Red (Nonaktif)

## Layout System
**Mobile-First Constraint**: 540px maximum width, centered on desktop with dark background bleed
**Spacing Units**: Use Tailwind units of 2, 3, 4, 6, 8 for consistent rhythm

## Component Library

### Navigation
- **Bottom Nav Bar**: Fixed bottom, 5 icons (Home, Live, Center Logo, History, Account), gradient underline on active
- **Admin Sidebar**: Dark background, white text, nested menu structure with exact items from mockup

### Cards
- **Event Cards**: White background, gradient border (2px), rounded corners, image top, title, price, 'Beli' button
- **Admin Cards**: Clean white with subtle shadows, form inputs with labels

### Buttons
- **Primary (Holographic)**: Rainbow gradient background, bold text, rounded
- **Gold CTA**: #FFB800 background, dark text
- **Secondary**: Outlined style with gradient border
- **Action Buttons**: Small pills for Edit, Detail, Hapus, etc.

### Forms
- **Input Fields**: Light gray background, rounded borders, Rajdhani Medium
- **Text Editors**: Rich text editor for event descriptions
- **File Upload**: Image preview with drag-drop area

### Tables
- **Admin Tables**: Bordered cells, alternating row backgrounds, action button columns, search bar above
- **Status Badges**: Colored pills matching status colors

### Media
- **Banner Carousel**: Auto-rotating hero images with indicators
- **Video Grid**: 2-column grid, play button overlay, thumbnail images
- **Event Images**: 16:9 aspect ratio in cards

### Special Elements
- **Login Page**: WhatsApp number field, OTP input, holographic 'Masuk' button, gradient background
- **Winner Badge**: Gold trophy icon in history
- **Payment Logos**: Grid of payment method icons in footer
- **Social Icons**: Gradient-filled social media links

## Images
- **Hero Banner**: Full-width carousel images (banner01.jpg provided)
- **Event Thumbnails**: Product/prize images in cards
- **Logo**: Undifest logo in header and center nav button
- **Video Thumbnails**: Preview images with play overlays

## Animations
Minimal - only essential UI feedback:
- Carousel auto-advance (3-4 seconds)
- Button hover states
- Tab switching transitions