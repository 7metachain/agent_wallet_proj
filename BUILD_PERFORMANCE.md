# Build Performance Optimizations

This document outlines the optimizations implemented to improve Next.js compilation time.

## Optimizations Implemented

### 1. Next.js Configuration (`next.config.js`)

- **SWC Minification**: Enabled `swcMinify: true` for faster builds using Rust-based minification
- **Worker Threads**: Enabled `workerThreads` in experimental settings to use multiple CPU cores
- **CPU Optimization**: Configured to use all available CPUs minus one to prevent system bottlenecks
- **Package Import Optimization**: Added `optimizePackageImports` for tree-shaking of:
  - `lucide-react` - Icon library
  - `@radix-ui/react-slot` - UI components
  - `@radix-ui/react-scroll-area` - Scroll area component
- **Webpack Caching**: Enabled filesystem cache with deterministic module IDs for faster rebuilds
- **Split Chunks**: Optimized chunk splitting for async imports only
- **ESLint Disabled During Build**: ESLint is now skipped during build to speed up compilation
- **Image Optimization**: Configured modern formats (AVIF, WebP) for better compression

### 2. TypeScript Configuration (`tsconfig.json`)

- **Incremental Compilation**: Enabled `incremental` mode with `.next/tsbuildinfo` cache
- **Fast Module Resolution**: Using `bundler` strategy for faster resolution
- **Relaxed Type Checks**: Disabled `noUnusedLocals` and `noUnusedParameters` to skip additional scanning
- **Excluded .next Directory**: Added `.next` to exclude list to avoid re-checking build artifacts

### 3. ESLint Configuration (`.eslintrc.json`)

- **Caching Enabled**: ESLint now caches results in `.eslintcache`
- **Content-Based Caching**: Uses file content hash for cache validation

### 4. Environment Configuration

- **`.env.production`**: Created production-specific environment file

## Usage Tips

### Development
```bash
npm run dev
```
- Uses hot reload with incremental compilation
- Cache is preserved between changes

### Production Build
```bash
npm run build
```
- Applies all production optimizations
- Uses compiled `.next` directory cache

### Type Checking (Separate)
If you want to run type checking without rebuilding:
```bash
tsc --noEmit
```

### Clear Cache
To clear compilation cache if needed:
```bash
rm -rf .next
rm -rf .eslintcache
npm run build
```

## Build Time Expectations

With these optimizations:
- **Cold build** (first time): Usually 60-90 seconds
- **Warm build** (with cache): Usually 20-40 seconds
- **Dev mode recompilation**: Usually 5-15 seconds

Actual times depend on your system specs and number of pages.

## Further Optimization Options (If Needed)

1. **Disable Type Checking During Build**:
   - Set `typescript.ignoreBuildErrors: true` in `next.config.js`
   - Run type checking in CI/CD only
   - ⚠️ Not recommended for development

2. **Code Splitting**:
   - Review large dependencies that could be split
   - Consider lazy loading components with `next/dynamic`

3. **Pre-built Dependencies**:
   - Some heavy dependencies (wagmi, viem) are already optimized
   - Ensure you're using the latest versions

## Monitoring Build Time

Track build time improvements with:
```bash
time npm run build
```

## References

- [Next.js Build Optimization](https://nextjs.org/docs/app/building-your-application/optimizing)
- [SWC Configuration](https://swc.rs/)
- [TypeScript Performance](https://www.typescriptlang.org/docs/handbook/compiler-options.html)
- [ESLint Caching](https://eslint.org/docs/latest/use/command-line-interface#caching)
