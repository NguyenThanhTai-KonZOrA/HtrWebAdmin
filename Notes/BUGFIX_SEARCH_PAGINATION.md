# 🔍 Search Pagination Bug Fix

## Vấn đề gặp phải

### Mô tả:
Khi search trong table, chỉ tìm được dữ liệu ở **page hiện tại**. Records ở các page khác không hiển thị trong kết quả search.

### Ví dụ:
```
Scenario:
- Total records: 100 items
- Current page: 3 (showing items 21-30)
- Search keyword: "John"
- John's record ở page 1 (item #5)

Result: ❌ Không thấy John
Phải chuyển về page 1 thì mới thấy
```

## Nguyên nhân

### Root Cause:
Logic search và pagination hoạt động đúng:
1. ✅ **Filter ALL records** → `filteredNewRegistrations`
2. ✅ **Paginate filtered results** → `paginatedNewRegistrations`

**NHƯNG:**
- Khi user search, `newRegPage` state **KHÔNG được reset**
- Nếu đang ở page 3 và search cho 5 kết quả → vẫn cố hiển thị page 3
- Page 3 của 5 items = **EMPTY** (chỉ có 1 page)

### Code Flow:
```typescript
// User ở page 3 (newRegPage = 2)
newRegPage = 2
rowsPerPage = 10

// User search "John" → 5 results
filteredNewRegistrations.length = 5

// Pagination calculation
startIndex = 2 * 10 = 20
paginatedData = filteredNewRegistrations.slice(20, 30)
// → slice(20, 30) trên array 5 items = [] EMPTY!
```

## Giải pháp

### Fix Implementation:
Thêm **useEffect** để reset page về 0 mỗi khi search query thay đổi:

```typescript
// Reset page to 0 when search changes
useEffect(() => {
    setNewRegPage(0);
}, [newRegSearch]);

useEffect(() => {
    setMembershipPage(0);
}, [membershipSearch]);
```

### How It Works:
1. User nhập search keyword
2. `newRegSearch` state thay đổi
3. useEffect trigger → `setNewRegPage(0)`
4. `filteredNewRegistrations` được tính lại (useMemo)
5. `paginatedNewRegistrations` hiển thị page 1 của kết quả search
6. ✅ User thấy tất cả kết quả search từ đầu

## Code Changes

### Before:
```typescript
// No automatic page reset
const [newRegSearch, setNewRegSearch] = useState('');
const [newRegPage, setNewRegPage] = useState(0);

// Search changes but page stays the same
// → Can show empty results if current page > total pages
```

### After:
```typescript
const [newRegSearch, setNewRegSearch] = useState('');
const [newRegPage, setNewRegPage] = useState(0);

// Auto reset page when search changes
useEffect(() => {
    setNewRegPage(0);
}, [newRegSearch]);

useEffect(() => {
    setMembershipPage(0);
}, [membershipSearch]);
```

## Testing Scenarios

### ✅ Test Case 1: Basic Search
```
1. Navigate to page 3
2. Search for "John"
3. Expected: Auto jump to page 1, show John's record
4. Result: ✅ PASS
```

### ✅ Test Case 2: Search with Multiple Results
```
1. Navigate to page 5
2. Search keyword returns 25 results (3 pages)
3. Expected: Jump to page 1, can navigate through 3 pages
4. Result: ✅ PASS
```

### ✅ Test Case 3: Clear Search
```
1. Search for "John" (on page 1 of results)
2. Clear search input
3. Expected: Back to page 1 of all records
4. Result: ✅ PASS
```

### ✅ Test Case 4: No Results
```
1. Navigate to page 3
2. Search for keyword with no results
3. Expected: Page 1 with "No data" message
4. Result: ✅ PASS
```

## Benefits

### UX Improvements:
- ✅ **Intuitive behavior**: Search always shows results from the beginning
- ✅ **No confusion**: Users won't see empty pages
- ✅ **Consistent**: Same behavior for both tables (New Registration & Membership)
- ✅ **Fast**: Instant page reset, no delay

### Technical Benefits:
- ✅ **Simple solution**: Just 2 small useEffect hooks
- ✅ **React best practices**: Using proper dependency arrays
- ✅ **No performance impact**: useEffect is lightweight
- ✅ **Maintainable**: Clear separation of concerns

## Edge Cases Handled

### 1. Empty Search
```typescript
Search: "" (empty)
→ Shows all records from page 1 ✅
```

### 2. Rapid Search Changes
```typescript
User types: "J" → "Jo" → "Joh" → "John"
→ Page resets 4 times, shows latest results ✅
```

### 3. Search → Navigate → Clear Search
```typescript
1. Search "John" → page 1
2. Navigate to page 2 of results
3. Clear search
→ Reset to page 1 of all records ✅
```

### 4. Same Search Term
```typescript
Search: "John"
Type again: "John"
→ newRegSearch unchanged → useEffect doesn't fire
→ Page stays where it is ✅
```

## Alternative Solutions Considered

### Option 1: Reset in onChange handler ❌
```typescript
onChange={(e) => {
    setNewRegSearch(e.target.value);
    setNewRegPage(0); // Could work but less clean
}}
```
**Why not:** Mixing concerns, less declarative

### Option 2: Reset in filter useMemo ❌
```typescript
const filteredNewRegistrations = useMemo(() => {
    setNewRegPage(0); // ❌ Side effect in useMemo!
    return newRegistrations.filter(...)
}, [newRegistrations, newRegSearch]);
```
**Why not:** Anti-pattern, side effects in pure functions

### Option 3: useEffect (Chosen) ✅
```typescript
useEffect(() => {
    setNewRegPage(0);
}, [newRegSearch]);
```
**Why yes:** 
- Declarative
- Separation of concerns
- React best practice
- Clear intention

## Related Files

- `src/pages/AdminRegistrationPage.tsx` - Main implementation

## Performance Impact

- **Negligible**: useEffect fires only when search term changes
- **No extra renders**: State update is batched by React
- **No API calls**: Pure client-side logic
- **Memory**: No additional memory usage

## Browser Compatibility

- ✅ All modern browsers
- ✅ React 16.8+ (hooks support)
- ✅ No polyfills needed

---

**Issue**: Search only works on current page  
**Fix**: Auto-reset page to 0 when search changes  
**Impact**: Better UX, no breaking changes  
**Lines Changed**: +8 lines  
**Status**: ✅ Fixed and Tested
