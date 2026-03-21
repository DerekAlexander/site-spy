# Site Spy Diff Viewer - Testing Guide

## Test Scenarios

### Scenario 1: H1 Change Detection
1. Add competitor URL
2. Click "Check" for baseline
3. Modify H1 tag on site
4. Click "Check" again
5. Expand "View Details"
6. Verify DiffViewer shows H1 change with old/new values

### Scenario 2: Multiple Changes
1. Make changes to: H1, button text, add images
2. Run "Check"
3. Verify 3+ separate diffs shown in expanded view

### Scenario 3: Change History Timeline
1. Run 3 checks with changes between each
2. Click "View Details" on changes list
3. Verify timeline shows all 3 entries with timestamps

### Scenario 4: Severity Levels
- H1/H2 changes should show 🔴 Red (High)
- Button changes should show 🟠 Orange (Medium)
- H3/Link changes should show 🔵 Blue (Low)

### Scenario 5: localStorage Validation
- Check browser DevTools → Application → Local Storage
- Verify changes array contains objects (not strings)
- Verify each object has: type, element, oldValue, newValue, severity

## Acceptance Checklist
- [ ] Diff viewer displays side-by-side comparison
- [ ] Old values show on left (red)
- [ ] New values show on right (green)
- [ ] Timestamps appear for each change
- [ ] Multiple changes per check are supported
- [ ] Severity colors display correctly
- [ ] localStorage stores structured data
- [ ] UI expands/collapses smoothly
