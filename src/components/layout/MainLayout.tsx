import { Box, Button, MenuItem, Select, Typography } from "@mui/material";

interface MainLayoutProps {
  children: React.ReactNode;
  onHome?: () => void;
}

export default function MainLayout({ children, onHome }: MainLayoutProps) {

  // const flagSrc = (lang: string) =>
  //   lang === "vi" ? "vn.png" : "us.png";

  return (
    <Box
      minHeight="100vh"
      bgcolor="#f8f8f8"
      display="flex"
      flexDirection="column"
    >
      {/* Header */}
      <Box
        bgcolor="#274549"
        color="#fff"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={2}
        py={1.5}
        minHeight={60}
        position="relative"
      >
        {/* Logo */}
        <img src="/images/TheGrandHoTram.png" alt="Logo" style={{ height: 60 }} />

        {/* Home button */}
        {onHome && (
          <Button
            variant="contained"
            size="small"
            onClick={onHome}
            sx={{
              position: "absolute",
              right: 120, // chừa chỗ cho dropdown
              bgcolor: "#fff",
              color: "#274549",
              fontWeight: 600,
              "&:hover": { bgcolor: "#f4f4f4" },
            }}
          >
            Home
          </Button>
        )}

        {/* Language selector */}
        <Box
          position="absolute"
          right={16}
          display="flex"
          alignItems="center"
          gap={1}
        >
          {/* <img
            src={flagSrc(currentLang)}
            alt="flag"
            style={{ width: 24, height: 16, borderRadius: 2 }}
          /> */}
        </Box>
      </Box>

      {/* Content */}
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        {children}
      </Box>
    </Box>
  );
}
