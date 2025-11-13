# Ark UI Toast Components

This document describes the Ark UI toast components that have been integrated into the NutriChef application.

## Overview

The application now includes two toast notification components built with Ark UI:
- **BasicToast**: A simple toast component for basic notifications
- **ToastTypes**: A comprehensive toast component supporting different notification types (success, error, warning, info)

## Components Location

All toast components are located in `/src/components/ui/`:
- `basic-toast.tsx` - Basic toast implementation
- `demo.tsx` - Toast types demo with multiple variants

## Dependencies

The components require the following dependencies (already installed):
- `@ark-ui/react` (v4.3.2) - Core Ark UI components
- `lucide-react` (v0.546.0) - Icon library

## Basic Toast Component

### Usage

```tsx
import ToastBasic from "@/components/ui/basic-toast";

function MyComponent() {
  return <ToastBasic />;
}
```

### Features
- Simple notification with title and description
- Configurable placement (bottom-end)
- Close button
- Smooth animations

## Toast Types Component

### Usage

```tsx
import ToastTypes from "@/components/ui/demo";

function MyComponent() {
  return <ToastTypes />;
}
```

### Features
- Four notification types:
  - **Success**: Green theme with CheckCircle icon
  - **Error**: Red theme with AlertCircle icon
  - **Warning**: Yellow theme with AlertTriangle icon
  - **Info**: Blue theme with Info icon
- Color-coded left border
- Icon indicators
- Dark mode support

## Demo Page

A demo page is available at `/toast-demo` route to showcase both components. This page demonstrates:
- Basic toast functionality
- All toast types (success, error, warning, info)
- Interactive buttons to trigger notifications

To access the demo page:
1. Log in to the application
2. Navigate to `/toast-demo`
3. Click the buttons to see different toast notifications

## Customization

### Toaster Configuration

Both components use `createToaster` with the following configuration:
- `placement: "bottom-end"` - Notifications appear at bottom-right
- `gap: 16` - 16px gap between multiple toasts
- `overlap: true` - Allow toasts to stack

### Styling

All components use Tailwind CSS classes and support dark mode:
- Light mode: White background with gray borders
- Dark mode: Gray-800 background

### Example: Creating Custom Toasts

```tsx
import { createToaster } from "@ark-ui/react/toast";

const myToaster = createToaster({
  placement: "top-center",
  gap: 20,
  overlap: false,
});

// Trigger a toast
myToaster.create({
  title: "Custom Title",
  description: "Custom description text",
  type: "success",
});
```

## Comparison with Sonner

The application currently uses both:
- **Sonner** (`/src/components/ui/sonner.tsx`) - Used throughout the application
- **Ark UI Toast** (`/src/components/ui/basic-toast.tsx`, `/src/components/ui/demo.tsx`) - New components

### When to Use Each

- **Sonner**: For existing application features and quick notifications
- **Ark UI Toast**: For new features requiring more customization or specific design requirements

## Related Files

- `/src/components/ui/basic-toast.tsx` - Basic toast component
- `/src/components/ui/demo.tsx` - Toast types demo component
- `/src/pages/ToastDemoPage.tsx` - Demo page showcasing the components
- `/src/App.tsx` - Route configuration

## Technical Notes

- Components use "use client" directive for client-side rendering
- Built with TypeScript for type safety
- Uses Ark UI Portal for proper toast positioning
- Fully accessible with proper ARIA attributes
- Smooth CSS transitions and animations

## Security

All dependencies have been checked for security vulnerabilities:
- `@ark-ui/react` v4.3.2: No vulnerabilities found
- No security issues detected in component code
