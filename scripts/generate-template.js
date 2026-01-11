import XLSX from 'xlsx';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create worksheet data
const wsData = [
    ['OldPlayerId', 'NewPlayerId'],
    [1234, 100001234],
    [1111, 100001111],
];

// Create workbook and worksheet
const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet(wsData);

// Set column widths
ws['!cols'] = [
    { wch: 15 },
    { wch: 15 }
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'SyncData');

// Write to file
const outputPath = join(__dirname, '..', 'public', 'templates', 'TemplateSyncIncomeDocument.xlsx');
writeFileSync(outputPath, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));

console.log('Template created successfully at:', outputPath);
