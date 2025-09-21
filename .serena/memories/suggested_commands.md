# FluxChat Development Commands

## Daily Development
```bash
# Start development server with Shopify integration
bun run dev
# Alternative: shopify app dev

# Update ngrok URL when tunnel changes
bun run update-ngrok https://new-url.ngrok-free.app

# Build for production
bun run build

# Deploy to Shopify
bun run deploy
```

## Database Management
```bash
# Run database migrations
bun run db:migrate

# Reset database (CAUTION: destroys data)
bun run db:reset

# Seed database with initial data
bun run db:seed

# Generate Prisma types after schema changes
bun run setup

# Generate Supabase types
bun run gen-types
```

## Code Quality
```bash
# Lint code (run before commits)
bun run lint

# Format code (Prettier)
bunx prettier --write .

# Type check
bunx tsc --noEmit
```

## Shopify Development
```bash
# Generate new app components
bun run generate

# Link app configuration
bun run config:link

# Switch between app configurations
bun run config:use

# Manage environment variables
bun run env
```

## Testing & Deployment
```bash
# Start production server locally
bun run start

# Docker deployment setup
bun run docker-start
```

## System Commands (macOS)
```bash
# File operations
ls -la          # List files with details
find . -name "*.ts" -type f    # Find TypeScript files
grep -r "pattern" .            # Search in files
pbcopy < file.txt              # Copy file to clipboard

# Process management
lsof -i :3000   # Check what's using port 3000
killall node    # Kill all Node processes
```

## Git Workflow
```bash
# Standard workflow
git status
git add .
git commit -m "feat: implement session management"
git push origin main

# Branch management
git checkout -b feature/new-feature
git merge feature/new-feature
git branch -d feature/new-feature
```

## Package Management
```bash
# Install dependencies
bun install

# Add new package
bun add package-name

# Add dev dependency
bun add -D package-name

# Update packages
bun update
```