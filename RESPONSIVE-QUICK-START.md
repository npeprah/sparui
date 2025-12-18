# Responsive System Quick Start Guide

## For Developers: 5-Minute Guide

### Import the Hooks

```typescript
import { useMediaQuery, useOrientation } from './hooks'
```

### Use Responsive Detection

```typescript
function MyComponent() {
  const { isMobile, isTablet, isDesktop } = useMediaQuery()

  return (
    <div>
      {isMobile && <MobileView />}
      {isDesktop && <DesktopView />}
    </div>
  )
}
```

### Apply Responsive Classes

```typescript
// Text sizes
className="text-sm md:text-base lg:text-lg"

// Spacing
className="p-4 md:p-6 lg:p-8"

// Layout
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Touch targets (REQUIRED for buttons)
className="min-h-[48px]"
```

### Breakpoints Reference

```
Mobile:  0px    ──────► 767px
Tablet:  768px  ──────► 1023px
Desktop: 1024px ──────► ∞
```

### Common Patterns

#### 1. Responsive Button
```typescript
<Button
  className="min-h-[48px]"  // Touch target
  fullWidth                  // Full width on mobile
>
  Click Me
</Button>
```

#### 2. Responsive Grid
```typescript
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

#### 3. Responsive Text
```typescript
<h1 className="text-2xl sm:text-3xl md:text-4xl">
  Heading
</h1>
```

#### 4. Stack on Mobile
```typescript
<div className="flex flex-col md:flex-row gap-4">
  <div>Left</div>
  <div>Right</div>
</div>
```

#### 5. Hide on Mobile
```typescript
<div className="hidden md:block">
  Desktop only content
</div>
```

### Testing Checklist

- [ ] Test at 320px (iPhone SE)
- [ ] Test at 768px (iPad)
- [ ] Test at 1024px (Desktop)
- [ ] All buttons have min-h-[48px]
- [ ] No horizontal scroll
- [ ] Text is readable

### Common Mistakes to Avoid

❌ **Don't:** Use fixed widths
```typescript
className="w-[500px]"  // Will break on mobile
```

✅ **Do:** Use responsive widths
```typescript
className="w-full md:w-[500px]"
```

❌ **Don't:** Forget touch targets
```typescript
<button className="p-2">  // Too small for touch
```

✅ **Do:** Use minimum heights
```typescript
<button className="p-2 min-h-[48px]">
```

❌ **Don't:** Use fixed text sizes
```typescript
className="text-xl"  // Same on all devices
```

✅ **Do:** Scale text responsively
```typescript
className="text-lg md:text-xl"
```

### Need Help?

- **Documentation:** See `TASK-029-IMPLEMENTATION.md`
- **Visual Guide:** See `TASK-029-VISUAL-GUIDE.md`
- **Summary:** See `TASK-029-SUMMARY.md`

### Quick Commands

```bash
# Run tests
npm test

# Build
npm run build

# Dev server
npm run dev
```

That's it! You're ready to build responsive components. 🚀
