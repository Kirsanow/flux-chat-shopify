# Smart Sales Assistant Implementation Plan

## 🎯 **Vision**
Transform FluxChat from basic chat to intelligent sales assistant that understands merchant instructions and recommends products intelligently.

## 🏗️ **Architecture Overview**

### Core Components
1. **AI Instructions System** - Merchants write natural language sales instructions
2. **Product Sync & Search** - Local product database with embedding-based search
3. **Intelligent Recommendation Engine** - LLM + tools approach for flexible matching
4. **Chat Integration** - AI uses product recommendations in conversations

### Key Decisions Made
- ✅ Use product sync (not direct Shopify API) for speed and embeddings
- ✅ No preprocessing complexity - process instructions at runtime
- ✅ Allow instructions before/after product sync for better UX
- ✅ LLM + tools approach for flexible, maintainable system

---

## 📋 **Phase 1: Foundation (Week 1)** ✅ **COMPLETED**

**🎉 Phase 1 Summary:**
- ✅ Database schema ready with `ai_config.instructions` field
- ✅ Product search service with keyword, name, and embedding search
- ✅ Merchant dashboard with AI instructions UI
- ✅ Complete merchant onboarding flow (sync → instruct → configure → chat)
- ✅ Clean, extensible foundation for AI integration

**Ready for Phase 2: AI Integration** 🚀

### Task 1.1: Database Schema Updates
**Status**: ✅ Completed
**Time**: 30 minutes
**Description**: Add AI instructions field to stores table

**What was implemented**:
- Used existing `ai_config` JSONB field instead of separate `ai_instructions` TEXT
- Consolidated approach: `ai_config.instructions` stores merchant instructions
- More extensible for future AI configuration options

**Acceptance Criteria**:
- [x] Database schema updated successfully
- [x] Prisma schema reflects changes
- [x] Clean, consolidated approach implemented

---

### Task 1.2: Product Search Service
**Status**: ✅ Completed
**Time**: 2 hours
**Description**: Create simple product search functions that will be used as AI tools

**What was implemented**:
- `app/lib/services/product-search.server.ts` with clean, simple functions
- Three search methods: keywords, product names, embeddings
- Stock-aware filtering (only returns available products)
- Price constraint extraction from natural language
- Ready for AI tool integration

**Key Functions Implemented**:
```typescript
searchProductsByKeywords(query: string, storeId: string, limit?: number)
searchProductsByNames(productNames: string[], storeId: string, limit?: number)
searchProductsByEmbedding(queryEmbedding: number[], storeId: string, limit?: number)
generateQueryEmbedding(query: string)
extractPriceConstraints(query: string)
```

**Acceptance Criteria**:
- [x] Keyword search works across title, description, tags, product_type, vendor
- [x] Embedding search returns semantically similar products using pgvector
- [x] All searches filter by available_for_sale and inventory > 0
- [x] Returns max 5 products with consistent ProductSearchResult structure
- [x] Price constraint extraction from natural language queries

---

### Task 1.3: AI Instructions UI
**Status**: ✅ Completed
**Time**: 1.5 hours
**Description**: Add instructions interface to merchant dashboard

**What was implemented**:
- Dashboard preview card showing instruction status and preview
- Dedicated `/app/ai-instructions` page with full editor
- Updated Quick Setup flow to include AI instructions as step 3
- Helpful examples, tips, and guidance for merchants
- Auto-save with success/error feedback

**Files Created/Modified**:
- `app/routes/app._index.tsx` - Added AI instructions card and setup step
- `app/routes/app.ai-instructions.tsx` - Full instructions editor page

**Key Features**:
- Instructions stored in `ai_config.instructions` field
- Large textarea with helpful placeholder examples
- Tips sidebar with best practices
- Visual indicators (green badges) when completed
- Mobile-responsive Polaris design

**Acceptance Criteria**:
- [x] Dashboard shows instructions preview with status
- [x] Dedicated page for full editing with tips
- [x] Form submission with success/error feedback
- [x] Clear placeholder text with realistic examples
- [x] Integrated into Quick Setup flow as step 3

---

## 📋 **Phase 2: AI Integration (Week 2)**

### Task 2.1: Product Search Tools
**Status**: Pending
**Time**: 1 hour
**Description**: Create AI tools that can search products

**Files to Create**:
- `app/lib/ai/product-tools.server.ts`

**Tools to Implement**:
```typescript
const productSearchTool = {
  name: "search_products",
  description: "Search for products by keywords or product names",
  parameters: {
    query: "Search query (keywords, product names, or description)",
    search_type: "keyword | semantic | exact_names",
    max_results: "Maximum products to return (default 5)"
  }
};
```

**Acceptance Criteria**:
- [ ] Tool properly integrated with Vercel AI SDK
- [ ] Handles different search types
- [ ] Returns formatted product data for AI
- [ ] Includes stock status and pricing

---

### Task 2.2: Recommendation Engine
**Status**: Pending
**Time**: 2.5 hours
**Description**: Core AI recommendation system that combines instructions + product search

**Files to Create**:
- `app/lib/ai/recommendation-engine.server.ts`

**Core Function**:
```typescript
async function getRecommendations(
  customerQuery: string,
  storeInstructions: string,
  storeId: string
): Promise<RecommendationResult>
```

**Flow**:
1. Create system prompt with store instructions
2. Process customer query with LLM
3. Use product search tools to find relevant products
4. Format response with context

**Acceptance Criteria**:
- [ ] LLM understands store instructions
- [ ] Uses product search tools effectively
- [ ] Handles out-of-stock gracefully
- [ ] Returns structured recommendation data
- [ ] Processes queries in <1 second

---

### Task 2.3: Chat API Integration
**Status**: Pending
**Time**: 1 hour
**Description**: Integrate recommendation engine with existing chat API

**Files to Modify**:
- `app/routes/api.chat.tsx`

**Changes**:
```typescript
// Update system prompt to include store context
const systemPrompt = `
${baseSystemPrompt}

Store Sales Instructions:
${storeInstructions}

You have access to product search tools. Use them to recommend products based on customer queries and store instructions.
`;

// Add product search tools to AI model
const result = await streamText({
  model: aiModel,
  system: systemPrompt,
  tools: productSearchTools,
  messages: messages,
});
```

**Acceptance Criteria**:
- [ ] Chat API loads store instructions
- [ ] AI has access to product search tools
- [ ] Streaming still works with tool calls
- [ ] Error handling for missing instructions

---

## 📋 **Phase 3: Enhanced UX (Week 3)**

### Task 3.1: Instruction Examples & Onboarding
**Status**: Pending
**Time**: 1 hour
**Description**: Add helpful examples and onboarding flow

**Features**:
- Pre-filled instruction templates
- Industry-specific examples
- Progressive disclosure of features

**Acceptance Criteria**:
- [ ] Template selection for common store types
- [ ] Inline examples and help text
- [ ] Guided setup flow for new merchants

---

### Task 3.2: Recommendation Analytics
**Status**: Pending
**Time**: 1.5 hours
**Description**: Show merchants how AI is performing

**Files to Create**:
- `app/routes/app.analytics.tsx`

**Metrics to Track**:
- Most common customer queries
- Products recommended most often
- Which instructions are being used
- Click-through rates on recommendations

**Acceptance Criteria**:
- [ ] Analytics dashboard showing key metrics
- [ ] Real-time updates on recommendation usage
- [ ] Insights to improve instructions

---

### Task 3.3: Product Cards in Chat
**Status**: Pending
**Time**: 2 hours
**Description**: Rich product displays when AI recommends products

**Files to Modify**:
- Chat widget frontend components
- API response formatting

**Features**:
- Product images and pricing
- Add to cart buttons
- Stock status indicators
- Quick product details

**Acceptance Criteria**:
- [ ] Rich product cards in chat
- [ ] Functional add-to-cart integration
- [ ] Mobile-responsive design
- [ ] Loading states for product data

---

## 📋 **Phase 4: Testing & Optimization (Week 4)**

### Task 4.1: End-to-End Testing
**Status**: Pending
**Time**: 2 hours
**Description**: Complete flow testing with real data

**Test Scenarios**:
1. New merchant: Install → Write instructions → Sync products → Test chat
2. Customer queries: Various question types and edge cases
3. Stock scenarios: Out of stock products, alternatives
4. Performance: Response times under load

**Acceptance Criteria**:
- [ ] All user flows work smoothly
- [ ] No critical bugs or errors
- [ ] Performance meets standards (<1s responses)
- [ ] Edge cases handled gracefully

---

### Task 4.2: Instruction Quality Improvements
**Status**: Pending
**Time**: 1.5 hours
**Description**: Refine AI prompting and instruction processing

**Improvements**:
- Better system prompts
- Instruction parsing optimization
- Fallback strategies
- Response quality tuning

**Acceptance Criteria**:
- [ ] AI consistently follows merchant instructions
- [ ] Graceful handling of unclear instructions
- [ ] Good product recommendations across query types

---

### Task 4.3: Documentation & Launch Prep
**Status**: Pending
**Time**: 1 hour
**Description**: Merchant documentation and help resources

**Deliverables**:
- Instruction writing guide
- Best practices documentation
- Video tutorials
- FAQ section

**Acceptance Criteria**:
- [ ] Clear setup instructions for merchants
- [ ] Examples for different store types
- [ ] Troubleshooting guides

---

## 🎯 **Success Metrics**

### Technical Metrics
- [ ] Chat response time: <1 second average
- [ ] Product search accuracy: >85% relevant results
- [ ] System uptime: >99.5%
- [ ] Error rate: <1% of requests

### Business Metrics
- [ ] Merchant adoption: >70% write instructions within 7 days
- [ ] Engagement: Average session length increases by 50%
- [ ] Conversion: Product recommendations clicked >30% of time
- [ ] Satisfaction: >4.5/5 merchant rating

---

## 🔧 **Development Notes**

### Key Dependencies
- Vercel AI SDK (already integrated)
- OpenAI API for embeddings
- Shopify Admin API
- Existing product sync system

### Performance Considerations
- Use database indexes for fast product searches
- Cache embeddings after generation
- Optimize LLM calls with proper context management
- Monitor and limit API usage costs

### Future Enhancements
- Multi-language support
- Advanced analytics and A/B testing
- Integration with Shopify customer data
- Seasonal and promotional instruction overrides
- Learning from successful recommendations

---

**Total Estimated Time**: 3-4 weeks
**Priority**: High - Core differentiating feature
**Risk Level**: Medium - Depends on AI performance and merchant adoption