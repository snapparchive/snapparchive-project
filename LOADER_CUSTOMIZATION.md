# Loading Spinner Customization Guide

Your website now has a beautiful, centralized loading system that shows animated spinners throughout your application. Here's how to customize it in one place.

## How It Works

All loading states across your entire website use the same component: `LoadingSpinner` located at:
```
src/components/ui/loading-spinner.tsx
```

This single component controls the appearance of ALL loading screens in your application.

## Quick Customization

### Change the Loading Text

To change the default text, edit the component and update the `text` parameter:

```tsx
// In loading-spinner.tsx
text = 'Loading...'  // Change this to anything you want
```

### Change Colors

The loader uses your brand color (cyan/teal: #04a3c3). To change it:

1. **Option 1 - Edit the component directly** (Recommended):
   Open `src/components/ui/loading-spinner.tsx` and replace all instances of:
   - `cyan-500` with your color (e.g., `blue-500`, `purple-500`)
   - `cyan-400` with a lighter shade
   - `cyan-100` with the lightest shade

2. **Option 2 - Update globals.css**:
   Modify the primary color variables in `src/app/globals.css`

### Change Size

The loader comes in 4 sizes:
- `sm` - Small (32px)
- `md` - Medium (48px)
- `lg` - Large (64px)
- `xl` - Extra Large (96px)

To change the default size, edit `loading-spinner.tsx`:
```tsx
size = 'lg'  // Change to 'sm', 'md', 'lg', or 'xl'
```

### Change Animation Speed

Edit the animation speeds in `src/app/globals.css`:

```css
.animate-spin-slow {
  animation: spin-slow 3s linear infinite;  /* Change 3s to your preference */
}

.animate-pulse-slow {
  animation: pulse-slow 3s ease-in-out infinite;  /* Change 3s to your preference */
}
```

## Where Loading Screens Appear

Loading spinners automatically appear on these routes:
- `/` - Root loading
- `/login` - Login page loading
- `/register` - Register page loading
- `/forgot-password` - Forgot password loading
- `/dashboard` - Dashboard loading
- `/dashboard/documents` - Documents loading
- `/dashboard/settings` - Settings loading

## Component Usage

### Full-Page Loader
```tsx
import { LoadingSpinnerFullPage } from '@/components/ui/loading-spinner';

<LoadingSpinnerFullPage text="Loading Dashboard..." />
```

### Inline Loader (for sections within a page)
```tsx
import { LoadingSpinnerInline } from '@/components/ui/loading-spinner';

<LoadingSpinnerInline size="md" text="Loading data..." />
```

### Custom Loader
```tsx
import { LoadingSpinner } from '@/components/ui/loading-spinner';

<LoadingSpinner
  size="lg"
  fullScreen={false}
  text="Custom loading message"
/>
```

## Completely Replace the Loader

To use a completely different design:

1. Open `src/components/ui/loading-spinner.tsx`
2. Replace the entire component JSX with your custom design
3. Keep the same export names to maintain compatibility
4. All loading screens across the site will automatically use your new design

## Animation Details

The current loader features:
- **Dual spinning rings** - Outer ring spins clockwise, inner ring counter-clockwise
- **Pulsing center dot** - Adds visual interest
- **Glowing backdrop** - Subtle blur effect for depth
- **Bouncing dots** - Three dots animate below the text
- **Gradient background** - Soft gradient from slate to cyan when full-screen

All animations are defined in `src/app/globals.css` in the utilities layer.

## Need Help?

The loading system is built using:
- **Tailwind CSS** for styling
- **Custom animations** in globals.css
- **Next.js loading.tsx files** for automatic route loading states

Edit one file (`loading-spinner.tsx`) to change the entire website's loading experience!
