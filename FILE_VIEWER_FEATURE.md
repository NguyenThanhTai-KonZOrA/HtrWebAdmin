# 📄 File Viewer Feature - Income Documents

## Tổng quan

Tính năng xem file đã được nâng cấp để hỗ trợ **nhiều loại file** thay vì chỉ hình ảnh:
- ✅ **Images** (JPG, PNG, GIF, BMP, WEBP)
- ✅ **PDF** files
- ✅ **Word** documents (DOC, DOCX)
- ✅ **Excel** spreadsheets (XLS, XLSX)

## 🎯 Tính năng mới

### 1. Multi-format File Viewer
Người dùng có thể click vào icon **👁️ View** để xem:
- **Hình ảnh**: Hiển thị trực tiếp trong dialog
- **PDF**: Sử dụng native browser PDF viewer
- **Word/Excel**: Sử dụng Google Docs Viewer

### 2. File Type Icons
Mỗi file hiển thị với **icon phù hợp**:
- 🖼️ **Image Icon** (màu xanh lá) - cho file ảnh
- 📄 **PDF Icon** (màu đỏ) - cho file PDF
- 📝 **Doc Icon** (màu xanh dương) - cho file Word
- 📊 **Excel Icon** (màu xanh lá) - cho file Excel
- 📋 **Generic File Icon** (màu xám) - cho các file khác

### 3. Enhanced File List UI
- **Icon** hiển thị loại file
- **File name** với truncate nếu quá dài
- **File size** hiển thị bên dưới tên
- **Hover effect** khi di chuột qua
- **Action buttons**: View và Delete với tooltips

### 4. Download Button
Trong File Viewer Dialog có nút **Download** để tải file về máy

## 📁 Code Implementation

### Functions Created

#### 1. `getFileType(fileName: string)`
```typescript
// Xác định loại file dựa trên extension
// Returns: 'image' | 'pdf' | 'doc' | 'excel' | 'other'
```

#### 2. `getFileIcon(fileName: string)`
```typescript
// Trả về Material-UI Icon component phù hợp
// Với màu sắc tương ứng cho từng loại file
```

#### 3. `handleFileView(fileUrl: string)`
```typescript
// Mở dialog để xem file
// Hỗ trợ nhiều format khác nhau
```

### File Viewer Dialog Logic

```typescript
{(() => {
  const fileType = getFileType(fileName);
  
  if (fileType === 'image') {
    return <img src={selectedImage} />
  } else if (fileType === 'pdf') {
    return <iframe src={selectedImage} />
  } else if (fileType === 'doc' || fileType === 'excel') {
    return <iframe src={googleDocsViewerUrl} />
  } else {
    return <DownloadButton />
  }
})()}
```

## 🎨 UI/UX Improvements

### Before
```
┌──────────────────────────────────────────────┐
│ filename.pdf              50 KB  [👁️] [🗑️]  │
└──────────────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│ 📄  filename.pdf                [👁️] [🗑️]   │
│     50 KB                                    │
└──────────────────────────────────────────────┘
```

**Improvements:**
- ✅ Icon cho loại file
- ✅ 2-line layout (tên + size)
- ✅ Hover effect
- ✅ Border và shadow subtle
- ✅ Tooltips cho buttons
- ✅ Color-coded icons

## 🔧 Technical Details

### Supported Extensions

| Type   | Extensions              | Viewer              | Icon Color |
|--------|------------------------|---------------------|------------|
| Image  | jpg, jpeg, png, gif... | Native `<img>`      | Green      |
| PDF    | pdf                    | Browser PDF viewer  | Red        |
| Word   | doc, docx              | Google Docs Viewer  | Blue       |
| Excel  | xls, xlsx              | Google Docs Viewer  | Green      |
| Other  | *                      | Download only       | Grey       |

### Google Docs Viewer Integration

For Word and Excel files:
```typescript
const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`;
```

**Pros:**
- ✅ No server-side processing needed
- ✅ Works with public URLs
- ✅ Good compatibility

**Cons:**
- ⚠️ Requires public URL (file must be accessible from internet)
- ⚠️ May have loading delay
- ⚠️ Depends on Google's service

### Fallback Handling

If file type cannot be previewed:
```
┌─────────────────────────────┐
│   Preview not available     │
│   This file type cannot be  │
│   previewed in the browser  │
│                             │
│   [Download File]           │
└─────────────────────────────┘
```

## 🚀 Usage

### For Users
1. **Upload** income documents (any supported format)
2. **Click** 👁️ View icon to preview
3. **Download** if needed using Download button
4. **Delete** if file is incorrect

### For Developers
```typescript
// Use handleFileView for any file
<IconButton onClick={() => handleFileView(fileUrl, fileName)}>
  <VisibilityIcon />
</IconButton>

// Get appropriate icon
{getFileIcon(fileName)}

// Check file type
const type = getFileType(fileName);
```

## 📊 Browser Compatibility

| Browser | Image | PDF | Word/Excel |
|---------|-------|-----|------------|
| Chrome  | ✅    | ✅  | ✅         |
| Firefox | ✅    | ✅  | ✅         |
| Safari  | ✅    | ✅  | ✅         |
| Edge    | ✅    | ✅  | ✅         |

## 🔒 Security Considerations

1. **URL Encoding**: All URLs are properly encoded for Google Docs Viewer
2. **CORS**: Files must be accessible via CORS-enabled server
3. **File Validation**: Already validated on upload (accept attribute)
4. **Size Limits**: Enforced during upload process

## 🎯 Future Enhancements (Optional)

1. **Advanced PDF viewer** with zoom/rotate controls
2. **Local Office file rendering** (using libraries like pdf.js, mammoth.js)
3. **File annotations** capability
4. **Batch download** multiple files
5. **File version history**
6. **Thumbnail previews** in file list

---

**Created**: December 2, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready  
**Location**: `AdminRegistrationPage.tsx` - Income Document Section
