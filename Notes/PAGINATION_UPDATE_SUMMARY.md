# Pagination Update Summary

## Tổng Quan
Cập nhật hệ thống pagination trong `AdminRegistrationPage.tsx` để sử dụng server-side pagination với logic filter thông minh (client-first, fallback to server).

## Các Thay Đổi Chính

### 1. Thêm State Mới cho Server-side Pagination

```typescript
// Server-side pagination states
const [newRegTotalRecords, setNewRegTotalRecords] = useState(0);
const [membershipTotalRecords, setMembershipTotalRecords] = useState(0);
const [newRegServerSearch, setNewRegServerSearch] = useState('');
const [membershipServerSearch, setMembershipServerSearch] = useState('');
```

### 2. Cập Nhật Functions Load Data

**Trước:**
```typescript
const loadNewRegistrations = async () => {
    const data = await patronService.getAllPatrons(false);
    setNewRegistrations(data);
};
```

**Sau:**
```typescript
const loadNewRegistrations = async (searchTerm?: string, page?: number, pageSize?: number) => {
    const request = {
        IsMembership: false,
        Page: (page ?? newRegPage) + 1, // Server expects 1-based page index
        PageSize: pageSize ?? rowsPerPage,
        SearchTerm: searchTerm ?? newRegServerSearch
    };
    
    const response = await patronService.getAllPatronsWithPagination(request);
    setNewRegistrations(response.data);
    setNewRegTotalRecords(response.totalRecords);
};
```

### 3. Logic Filter Thông Minh (Client-First Strategy)

**Quy trình:**
1. **Khi user nhập search term:**
   - Filter dữ liệu ở client-side trước
   - Nếu có kết quả → Hiển thị kết quả client-side
   - Nếu KHÔNG có kết quả → Gọi API để search trên server

2. **Khi search term rỗng:**
   - Clear server search
   - Load lại data không filter

```typescript
useEffect(() => {
    setNewRegPage(0);
    
    if (newRegSearch.trim() === '') {
        if (newRegServerSearch !== '') {
            setNewRegServerSearch('');
            loadNewRegistrations('', 0, rowsPerPage);
        }
        return;
    }
    
    // Try client-side filter first
    const clientFiltered = newRegistrations.filter(patron =>
        patron.firstName?.toLowerCase().includes(newRegSearch.toLowerCase()) ||
        patron.lastName?.toLowerCase().includes(newRegSearch.toLowerCase()) ||
        // ... other fields
    );

    // If no client-side results, fetch from server
    if (clientFiltered.length === 0) {
        setNewRegServerSearch(newRegSearch);
        loadNewRegistrations(newRegSearch, 0, rowsPerPage);
    }
}, [newRegSearch]);
```

### 4. Cập Nhật Filter Logic

**Client-side filter:**
- Chỉ filter khi `newRegServerSearch` rỗng
- Nếu đang search từ server, trả về data trực tiếp

```typescript
const filteredNewRegistrations = useMemo(() => {
    if (newRegServerSearch) {
        return newRegistrations; // Server already filtered
    }
    
    // Client-side filter
    return newRegistrations.filter(patron => /* filter logic */);
}, [newRegistrations, newRegSearch, newRegServerSearch]);
```

### 5. Pagination Logic Kép

```typescript
const paginatedNewRegistrations = useMemo(() => {
    if (newRegServerSearch) {
        return newRegistrations; // Server already paginated
    }
    
    // Client-side pagination
    const startIndex = newRegPage * rowsPerPage;
    return filteredNewRegistrations.slice(startIndex, startIndex + rowsPerPage);
}, [filteredNewRegistrations, newRegPage, rowsPerPage, newRegServerSearch, newRegistrations]);
```

### 6. TablePagination Cập Nhật

```typescript
<TablePagination
    component="div"
    count={newRegServerSearch ? newRegTotalRecords : filteredNewRegistrations.length}
    page={newRegPage}
    onPageChange={(_, newPage) => {
        setNewRegPage(newPage);
        if (newRegServerSearch) {
            loadNewRegistrations(newRegServerSearch, newPage, rowsPerPage);
        }
    }}
    rowsPerPage={rowsPerPage}
    onRowsPerPageChange={(e) => {
        const newRowsPerPage = parseInt(e.target.value, 10);
        setRowsPerPage(newRowsPerPage);
        setNewRegPage(0);
        if (newRegServerSearch) {
            loadNewRegistrations(newRegServerSearch, 0, newRowsPerPage);
        }
    }}
/>
```

## Lợi Ích

### 1. **Performance Optimization**
- Client-side filter nhanh hơn cho data đã load
- Chỉ gọi API khi thực sự cần thiết
- Giảm số lượng request đến server

### 2. **Better User Experience**
- Response nhanh khi filter data có sẵn
- Tự động fallback sang server khi không tìm thấy
- Smooth transition giữa client và server search

### 3. **Scalability**
- Hỗ trợ dataset lớn với server-side pagination
- Load data theo batch, không load hết một lúc
- Giảm memory footprint

### 4. **Flexibility**
- Dễ dàng chuyển đổi giữa client và server mode
- Có thể điều chỉnh strategy dựa trên data size
- Maintain backward compatibility

## Testing Scenarios

### 1. **Client-side Search**
- Load page → có 50 records
- Search "John" → tìm thấy 5 records trong client
- ✅ Hiển thị 5 records ngay lập tức (không gọi API)

### 2. **Server-side Search**
- Load page → có 50 records
- Search "XYZ" → không tìm thấy trong client
- ✅ Gọi API search "XYZ" → hiển thị kết quả từ server

### 3. **Clear Search**
- Đang search "XYZ" từ server
- Clear search term
- ✅ Reset về load data ban đầu

### 4. **Pagination**
- **Client mode:** Slice array locally
- **Server mode:** Request new page từ API

### 5. **Change Rows Per Page**
- **Client mode:** Re-slice array với page size mới
- **Server mode:** Request với PageSize mới

## Notes

- Sử dụng `eslint-disable-next-line react-hooks/exhaustive-deps` để tránh infinite loop
- Page index: Client = 0-based, Server = 1-based (cần convert)
- Total records: Client = filtered array length, Server = totalRecords từ API

## Future Improvements

1. **Debounce Search Input**
   - Tránh gọi API quá nhiều khi user đang gõ
   - Implement debounce 300-500ms

2. **Cache Server Results**
   - Cache kết quả search từ server
   - Tránh duplicate requests

3. **Loading States**
   - Thêm loading indicator riêng cho search
   - Distinguish giữa initial load và search load

4. **Error Handling**
   - Retry mechanism cho failed requests
   - Fallback UI khi server error
