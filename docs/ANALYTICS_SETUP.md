# Google Analytics Setup

This dashboard includes Google Analytics integration to track user engagement and behavior.

## Setup Instructions

### 1. Create a Google Analytics Property

1. Go to [Google Analytics](https://analytics.google.com/)
2. Sign in with your Google account (or create one)
3. Click "Create" or "Add Property"
4. Set up a new property for your dashboard:
   - Property name: "Market Diagnostic Dashboard"
   - Website URL: `https://marketdiagnostictool.com`
   - Industry category: Finance
   - Business size: Small

### 2. Get Your Measurement ID

1. After creating the property, go to "Admin" (bottom left)
2. Under "Property," click "Data Streams"
3. Click on your website stream
4. Copy the "Measurement ID" (format: G-XXXXXXXXXX)

### 3. Update the Analytics Configuration

Replace the placeholder in `frontend/src/utils/analytics.ts`:

```typescript
const GA_ID = 'G-YOUR-MEASUREMENT-ID-HERE';
```

### 4. Deploy

Commit and deploy the changes:
```bash
git add -A
git commit -m "feat: Add Google Analytics tracking"
git push origin main
# Deploy to AWS as usual
```

## What Gets Tracked

The dashboard automatically tracks:

- **Page Views**: Every page navigation
  - Dashboard
  - Indicators page
  - Individual indicator details
  - Market news
  - System breakdown
  - Market map

- **Custom Events**:
  - `view_indicator`: When users view a specific indicator
  - `dashboard_refresh`: When users manually refresh data
  - `date_range_selected`: When users select 90d/6mo/1yr ranges
  - `navigate_page`: Page navigation events

## Viewing Your Analytics

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. View your data in:
   - **Real-time**: See visitors and actions as they happen
   - **Reports**: Analyze user behavior over time
   - **Pages and Screens**: See which pages are most popular
   - **Events**: View custom event tracking

## Privacy Considerations

- Google Analytics respects user privacy settings (Do Not Track, etc.)
- No personally identifiable information (PII) is collected
- Users can opt out via Google's tools or browser extensions
- Consider adding a privacy policy mentioning analytics usage

## Disabling Analytics

Analytics are automatically disabled in development mode. To disable in production temporarily, you can:
1. Remove the `initializeAnalytics()` call from `frontend/src/main.tsx`
2. Or set the GA_ID to an empty string
