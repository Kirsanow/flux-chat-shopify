# FluxChat Code Style & Conventions

## File Organization
```
flux-chat-shopify/
├── app/                    # Remix app (admin & backend)
│   ├── routes/            # API routes and pages
│   ├── lib/               # Shared utilities
│   └── types/             # TypeScript type definitions
├── extensions/            # Shopify theme extensions
│   └── chat-widget/       # Chat widget extension
│       ├── blocks/        # Liquid templates
│       └── assets/        # JS, CSS assets
├── prisma/               # Database schema
├── tasks/                # Task management files
└── docs/                 # Documentation
```

## Naming Conventions
- **Files**: kebab-case (`chat-widget.js`, `ai.server.ts`)
- **Components**: PascalCase (`FluxChatWidget`, `ChatModal`)
- **Functions**: camelCase (`sendMessage`, `getSessionId`)
- **Constants**: UPPER_SNAKE_CASE (`API_URL`, `SESSION_KEY`)
- **CSS Classes**: BEM-style (`flux-chat-widget`, `flux-message-content`)

## TypeScript Standards
- **Strict mode enabled**: All files must pass type checking
- **Interface over type**: Use `interface` for object shapes
- **Explicit return types**: For public functions and components
- **No any**: Avoid `any` type, use `unknown` or proper typing

## React/Remix Conventions
- **Functional components**: Use hooks over class components
- **Export patterns**: Named exports for utilities, default for components
- **Error boundaries**: Implement for production robustness
- **Loader/Action types**: Type all Remix route functions

## CSS Organization
- **Component-scoped**: Each component has its own CSS
- **BEM methodology**: Block__element--modifier pattern
- **CSS custom properties**: Use for theming and consistency
- **Mobile-first**: Responsive design with mobile base styles

## Database & API
- **Prisma schema**: Descriptive model and field names
- **API routes**: RESTful patterns with proper HTTP methods
- **Error handling**: Consistent error response format
- **Validation**: Use Zod for runtime type validation

## Widget Development (Vanilla JS)
- **Class-based**: Use ES6 classes for main components
- **No dependencies**: Vanilla JS only for theme compatibility
- **Event delegation**: Proper cleanup and memory management
- **Progressive enhancement**: Graceful degradation for older browsers

## Version Control
- **Commit messages**: Conventional commits (`feat:`, `fix:`, `docs:`)
- **Branch naming**: `feature/description`, `fix/issue-name`
- **Small commits**: Atomic changes with clear purposes
- **Code review**: All changes require review before merge

## Documentation
- **README updates**: Keep project documentation current
- **Code comments**: Explain why, not what
- **CLAUDE.md**: Project specifications and architecture
- **Task files**: Break down complex features into manageable tasks

## Performance
- **Bundle size**: Monitor and optimize widget size
- **Database queries**: Use efficient Prisma queries
- **Caching**: Implement appropriate caching strategies
- **Lazy loading**: Load components and data as needed