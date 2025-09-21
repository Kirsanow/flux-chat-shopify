# FluxChat Task Completion Workflow

## Standard Task Completion Checklist

### 1. Code Quality Gates
```bash
# Run before marking any task complete
bun run lint                    # ESLint checks
bunx tsc --noEmit              # TypeScript validation
bunx prettier --check .        # Code formatting check
```

### 2. Testing Requirements
```bash
# Manual testing workflow
bun run dev                    # Start development server
# Open browser to test changes
# Check browser console for errors
# Test across different devices/browsers
```

### 3. Git Workflow
```bash
# Before committing
git status                     # Check changed files
git diff                       # Review changes
git add .                      # Stage changes
git commit -m "feat: descriptive message"  # Commit with conventional format
```

### 4. Documentation Updates
- Update `CLAUDE.md` if architecture changes
- Update task files with progress
- Add comments for complex logic
- Update README if user-facing changes

### 5. Deployment Validation
```bash
# For widget changes
bun run deploy                 # Deploy to Shopify
# Test in actual Shopify store environment
# Verify localStorage functionality
# Check responsive design

# For API changes
bun run build                  # Ensure production build works
# Test API endpoints with Postman/browser
# Verify database operations
```

### 6. Performance Checks
- **Widget size**: Monitor JavaScript bundle size
- **Load time**: Ensure fast widget initialization
- **Memory usage**: Check for memory leaks in console
- **Database**: Verify efficient queries with Prisma

### 7. Browser Compatibility
- **Chrome**: Primary development browser
- **Safari**: Test localStorage behavior
- **Firefox**: Cross-browser validation
- **Mobile**: iOS Safari and Chrome Mobile

### 8. Session Management Validation
- **localStorage**: Test storage/retrieval
- **Private browsing**: Verify graceful fallback
- **Session persistence**: Test across page reloads
- **Reset functionality**: Validate conversation reset

## Feature-Specific Checklists

### Widget Development
- [ ] UI matches competitor specifications
- [ ] Responsive across all screen sizes
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Error handling and fallbacks
- [ ] Console logging for debugging

### API Development
- [ ] Proper error handling and status codes
- [ ] Input validation with Zod schemas
- [ ] Database transactions where needed
- [ ] Authentication and authorization
- [ ] Rate limiting considerations

### Database Changes
- [ ] Run migrations successfully
- [ ] Update TypeScript types
- [ ] Test rollback scenarios
- [ ] Verify data integrity
- [ ] Performance impact assessment

## Quality Standards
- **Code coverage**: Aim for >80% on critical paths
- **Performance**: Widget loads in <500ms
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: No sensitive data in client code
- **Reliability**: Graceful error handling everywhere