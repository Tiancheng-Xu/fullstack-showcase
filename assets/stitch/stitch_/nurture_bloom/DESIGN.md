---
name: Nurture & Bloom
colors:
  surface: '#fbf9f1'
  surface-dim: '#dcdad2'
  surface-bright: '#fbf9f1'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f4ec'
  surface-container: '#f0eee6'
  surface-container-high: '#eae8e0'
  surface-container-highest: '#e4e3db'
  on-surface: '#1b1c17'
  on-surface-variant: '#524535'
  inverse-surface: '#30312c'
  inverse-on-surface: '#f3f1e9'
  outline: '#847463'
  outline-variant: '#d6c3b0'
  surface-tint: '#845400'
  primary: '#845400'
  on-primary: '#ffffff'
  primary-container: '#ffb347'
  on-primary-container: '#704700'
  inverse-primary: '#ffb95a'
  secondary: '#42617d'
  on-secondary: '#ffffff'
  secondary-container: '#bddefe'
  on-secondary-container: '#43627e'
  tertiary: '#49654c'
  on-tertiary: '#ffffff'
  tertiary-container: '#abcaab'
  on-tertiary-container: '#3a563d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffddb6'
  primary-fixed-dim: '#ffb95a'
  on-primary-fixed: '#2a1800'
  on-primary-fixed-variant: '#643f00'
  secondary-fixed: '#cde5ff'
  secondary-fixed-dim: '#aacaea'
  on-secondary-fixed: '#001d32'
  on-secondary-fixed-variant: '#294964'
  tertiary-fixed: '#cbebca'
  tertiary-fixed-dim: '#afcfaf'
  on-tertiary-fixed: '#06210d'
  on-tertiary-fixed-variant: '#324d35'
  background: '#fbf9f1'
  on-background: '#1b1c17'
  surface-variant: '#e4e3db'
typography:
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Quicksand
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  stack-gap: 16px
  section-margin: 40px
---

## Brand & Style

The design system is centered on the concept of "Gentle Milestones." It targets parents and caregivers who seek a calm, supportive environment to document their child's development. The aesthetic leans into a **Soft-Tactile Minimalism**, combining the cleanliness of modern apps with the warmth of a physical nursery. 

The emotional response should be one of safety, nostalgia, and quiet joy. By using organic shapes and a high-key color palette, the UI avoids the sterile feel of medical data-tracking and instead feels like a digital keepsake box.

## Colors

The palette is anchored by a warm, sun-kissed coral-orange as the primary brand color, representing growth and energy. 

- **Primary (#FFB347):** Used for main actions, active states, and progress indicators.
- **Secondary (#A7C7E7):** A soft baby blue for informational callouts and boy-themed presets.
- **Tertiary (#C1E1C1):** A gentle mint green used for health-related metrics and "success" states.
- **Neutral (#FFFDF5):** A warm cream "Paper" color used as the global background to reduce eye strain compared to pure white.
- **Accent (#F4C2C2):** A soft pink for girl-themed presets or secondary decorative elements.

## Typography

This design system utilizes **Quicksand** for all Latin characters and numerals due to its rounded terminals and friendly geometric construction. For Chinese Simplified text, the system defaults to a high-quality rounded sans-serif (e.g., PingFang SC with rounded corners or Microsoft YaHei UI) to maintain the "soft" visual language.

Headlines use a tighter letter-spacing to feel "hugged" and cohesive. Body text maintains generous line-height to ensure readability for tired parents browsing late at night.

## Layout & Spacing

The layout follows a **Fluid-Safe** model. Content is contained within flexible cards that breathe with 24px internal padding. 

- **Grid:** A simple 4-column grid for mobile and 12-column for tablet/desktop. 
- **Rhythm:** An 8px base unit drives all spacing.
- **Safe Zones:** Top and bottom margins are oversized (40px+) to allow for easy thumb navigation and to avoid visual clutter near device edges.
- **Verticality:** Sections are separated by soft transitions or large whitespace rather than harsh dividers.

## Elevation & Depth

Depth is achieved through **Soft Ambient Shadows** rather than lines. Surfaces should feel like they are resting on a soft cushion.

- **Shadow Profile:** Use large blur radii (20px-40px) with very low opacity (5-8%) and a slight color tint derived from the primary coral or secondary blue.
- **Layers:** Use a maximum of three depth levels:
  1. **Base:** The warm cream background.
  2. **Card:** Raised slightly with a soft shadow to house content.
  3. **Floating:** High-elevation for primary action buttons or modal sheets.
- **Glassmorphism:** Use a subtle backdrop blur on navigation bars (10px blur, 80% opacity cream) to maintain the sense of depth while scrolling.

## Shapes

The shape language is **Ultra-Rounded and Organic**. 

- **Corners:** Standard components use a 16px radius, while main containers and buttons use a "super-ellipse" or pill-shape (32px+).
- **Icons:** Icons must have rounded caps and corners. Avoid sharp 90-degree angles.
- **Decorative:** Use "blob" shapes in the background—random, hand-drawn organic circles in pastel colors—to break the rigidity of the digital screen.

## Components

### Buttons
Primary buttons are pill-shaped, using the Primary Coral color with white text. They should have a "squishy" feel, achieved through a subtle inner shadow on the bottom to give a 3D tactile effect.

### Cards
Cards are the primary content vessel. They feature a 32px corner radius and no border. The background should be pure white (#FFFFFF) to pop against the warm cream background.

### Input Fields
Inputs are large (56px height) with a 16px corner radius. The focus state uses a 2px soft stroke of the secondary blue color and a subtle glow.

### Chips & Tags
Used for categories like "Feeding," "Sleep," or "Play." These are small pill shapes with a 10% opacity background of the category color and 100% opacity text for contrast.

### Progress Bars
Milestone trackers use thick, rounded progress bars (12px height). The "unfilled" portion is a lighter version of the "filled" track, rather than grey, to maintain the warm mood.

### Floating Action Button (FAB)
The "Add Entry" button is a large circle (64px) with a subtle "plus" icon, centered at the bottom of the screen with a high-depth ambient shadow.