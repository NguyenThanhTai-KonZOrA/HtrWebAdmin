// import * as React from "react";
// import { DataGrid, type GridColDef } from "@mui/x-data-grid";
// import { Box } from "@mui/material";

// const columns: GridColDef[] = [
//   { field: "id", headerName: "Ticket No", width: 100 },
//   { field: "name", headerName: "Name", flex: 1 },
//   { field: "service", headerName: "Service", flex: 1 },
//   { field: "phone", headerName: "Phone", flex: 1 },
//   { field: "time", headerName: "Time", flex: 1 },
// ];

// const initialRows = [
//   { id: 1, name: "Akitani", service: "Payment", phone: "+0901234567", time: "08:55" },
//   { id: 2, name: "Johny Tan", service: "Payment", phone: "+0901334567", time: "12:45" },
// ];

// export default function QueueTable() {
//   const [rows, setRows] = React.useState(initialRows);

//   return (
//     <Box sx={{ height: 400, width: "100%" }}>
//       <DataGrid
//         rows={rows || []} // ✅ đảm bảo không bao giờ undefined
//         columns={columns}
//         disableRowSelectionOnClick
//         sx={{
//           borderRadius: 2,
//           backgroundColor: "white",
//           "& .MuiDataGrid-cell": { fontSize: 14 },
//         }}
//       />
//     </Box>
//   );
// }
