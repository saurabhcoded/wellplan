# Calendar-Based Progress Tracking

## Overview
Updated the Progress page to show workout activity based on proper calendar periods instead of rolling date ranges.

## Changes Made

### Before (Rolling Dates):
- **Week**: Last 7 days from today (e.g., Oct 16 - Oct 22)
- **Month**: Last 30 days from today (e.g., Sep 23 - Oct 22)

### After (Calendar-Based):
- **Week**: Current week from Monday to Sunday (e.g., Oct 20 - Oct 26)
- **Month**: Current month from 1st to today (e.g., Oct 1 - Oct 22)

## Visual Layout

### Weekly View:
```
┌─────────────────────────────────────┐
│ Progress                            │
│ Oct 20 - Oct 26                     │
│                    [Week] [Month]   │
├─────────────────────────────────────┤
│ Workout Activity (Mon - Sun)        │
│ Mon Tue Wed Thu Fri Sat Sun         │
│  ■   ▓   █   ░   ■   ■   ✨        │
└─────────────────────────────────────┘
```

### Monthly View:
```
┌─────────────────────────────────────┐
│ Progress                            │
│ October 2025                        │
│                    [Week] [Month]   │
├─────────────────────────────────────┤
│ Workout Activity (1st - Today)      │
│ [Grid of 1-22 days]                 │
│ ■ ▓ █ ░ ■ ■ ✨ ... (22 boxes)       │
└─────────────────────────────────────┘
```

## Key Features

### 1. **Week View (Monday - Sunday)**
- ✅ Always starts on Monday
- ✅ Shows full week (7 days)
- ✅ Includes future days in current week (shown as gray)
- ✅ Day labels: Mon, Tue, Wed, Thu, Fri, Sat, Sun
- ✅ Date range shown: "Oct 20 - Oct 26"

### 2. **Month View (1st - Today)**
- ✅ Starts on 1st of current month
- ✅ Shows up to today (or end of month if past it)
- ✅ Dynamic number of boxes (1-31 depending on month)
- ✅ Month/year shown: "October 2025"
- ✅ Label: "(1st - Today)"

### 3. **Smart Date Calculation**
```javascript
// Week: Find Monday of current week
const dayOfWeek = today.getDay();
const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
monday.setDate(today.getDate() + diff);

// Month: Get 1st of month
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
```

### 4. **Context Display**
- Shows date range/period being viewed
- Helps users understand what they're looking at
- Updates automatically when switching views

## Benefits

### For Users:
✅ **Intuitive**: Week = Monday-Sunday, Month = 1st-End  
✅ **Consistent**: Matches calendar apps, planners  
✅ **Clear**: Date ranges explicitly shown  
✅ **Predictable**: Week always starts Monday  
✅ **Complete**: See full week/month context  

### For Planning:
✅ **Goal Setting**: Plan for the whole week  
✅ **Weekly Review**: See Monday-Friday work schedule  
✅ **Monthly Goals**: Track progress from month start  
✅ **Patterns**: Identify weekday vs. weekend habits  

## Example Scenarios

### Scenario 1: Mid-Week Review (Wednesday)
**Week View Shows:**
```
Mon Tue Wed Thu Fri Sat Sun
 ✅  ✅  ✅  ⬜  ⬜  ⬜  ⬜

Progress: 3/7 days (so far this week)
```

### Scenario 2: Monthly Check-in (Oct 15)
**Month View Shows:**
```
Oct 1 - Oct 15 (15 boxes)

Completed: 12 out of 15 days
Can still hit goal by month end!
```

### Scenario 3: Weekend Planning (Sunday)
**Week View Shows:**
```
Mon Tue Wed Thu Fri Sat Sun
 ✅  ✅  ✅  ✅  ✅  ⬜  ✅

Looking ahead: New week starts tomorrow (Monday)
```

## Technical Details

### Date Range Logic:

**Weekly:**
```javascript
// If today is Wednesday (Oct 22)
Monday = Oct 20
Sunday = Oct 26
Range = 7 days total
```

**Monthly:**
```javascript
// If today is Oct 22
Start = Oct 1
End = Oct 22
Range = 22 days (dynamic)
```

### Grid Layout:

**Weekly:**
- Fixed: Always 7 columns
- Responsive: Same on all screen sizes
- Day labels: Always visible

**Monthly:**
- Responsive: 7 cols mobile, 10 cols tablet, 15 cols desktop
- Dynamic: 1-31 boxes depending on days in month
- No day labels: Too many days

### Data Fetching:

```javascript
// Fetch from Monday of week OR 1st of month
const startDate = timeRange === 'week' 
  ? getMondayOfWeek() 
  : getFirstDayOfMonth();

// Fetch all data from that start date
await supabase
  .from('daily_logs')
  .gte('log_date', startDate)
  .order('log_date');
```

## UI Improvements

### Header:
```
Before: Progress              [Week] [Month]
After:  Progress              [Week] [Month]
        Oct 20 - Oct 26
```

### Activity Grid:
```
Before: Grid of last 7/30 days

After:  Mon Tue Wed Thu Fri Sat Sun  ← Day labels
        ■   ▓   █   ░   ■   ■   ✨
        ↑ Current week (Monday-Sunday)
```

### Legend Context:
```
Workout Activity (Mon - Sun)      ← Weekly
Workout Activity (1st - Today)    ← Monthly
```

## Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| Week Start | Today - 6 days | Monday of week |
| Week End | Today | Sunday of week |
| Month Start | Today - 29 days | 1st of month |
| Month End | Today | Today |
| Day Labels | None | Mon-Sun (weekly) |
| Date Context | None | Range displayed |
| Calendar Alignment | ❌ | ✅ |

## Future Enhancements (Ideas)

- [ ] Navigate to previous/next weeks
- [ ] Navigate to previous/next months
- [ ] Jump to specific week/month
- [ ] Year view (12 months)
- [ ] Quarter view (3 months)
- [ ] Compare weeks/months
- [ ] Show workout types per day
- [ ] Heatmap intensity overlay

---

**Result**: A calendar-aligned progress tracker that shows your workout activity in intuitive weekly (Mon-Sun) and monthly (1st-Today) views! 📅✨

