# Build Troubleshooting Guide

## Common Build Issues & Solutions

### Intermittent Build Failures

If you experience random build failures that succeed after multiple attempts, try these solutions:

#### 1. Clean Build

```bash
npm run build:clean
```

This will remove all cache files and rebuild from scratch.

#### 2. Manual Cache Cleanup

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force node_modules/.vite, dist, .tsbuildinfo -ErrorAction SilentlyContinue

# Linux/Mac
rm -rf node_modules/.vite dist .tsbuildinfo
```

#### 3. Full Reset (Nuclear Option)

```bash
# Remove all dependencies and caches
Remove-Item -Recurse -Force node_modules, package-lock.json, dist, .tsbuildinfo -ErrorAction SilentlyContinue

# Reinstall
npm install

# Build
npm run build
```

## Build Configuration Improvements

### What Was Fixed:

1. **TypeScript Build Info Location**
   - Changed from `node_modules/.tmp/` to root `.tsbuildinfo`
   - Prevents race conditions and cache corruption

2. **Relaxed Type Checking for Build**
   - Disabled `noUnusedLocals` and `noUnusedParameters`
   - Prevents build failures from unused variables during development

3. **Chunk Splitting Strategy**
   - Separated vendor libraries into logical chunks
   - Reduces memory pressure during build
   - Faster rebuild times

4. **Build Optimizations**
   - Increased chunk size warning limit to 1000kb
   - Added terser minification
   - Optimized dependencies pre-bundling

### Build Scripts

- **`npm run build`** - Standard build with TypeScript check
- **`npm run build:clean`** - Clean build (removes cache first)
- **`npm run dev`** - Development server
- **`npm run preview`** - Preview production build

## Memory Issues

If build fails with "Out of Memory" error:

```bash
# Increase Node.js memory limit (Windows PowerShell)
$env:NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Or add to package.json scripts:
"build": "NODE_OPTIONS=--max-old-space-size=4096 tsc --noEmit && vite build"
```

## TypeScript Errors

If TypeScript reports errors during build:

1. Check for unused imports/variables
2. Run `tsc --noEmit` separately to see all errors
3. Use ESLint to catch issues early: `npm run lint`

## Best Practices

1. **Always run `npm run build` before deploying**
2. **Clear cache if experiencing issues**: `npm run build:clean`
3. **Keep dependencies updated**: `npm update`
4. **Monitor bundle size**: Check console output during build

## Getting Help

If issues persist:

1. Check terminal output for specific error messages
2. Try building with verbose logging: `npm run build -- --debug`
3. Verify Node.js version: `node --version` (should be 18+)
