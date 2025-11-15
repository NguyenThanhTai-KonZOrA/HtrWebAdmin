// src/layouts/MainLayout.tsx
import { Box, Button, MenuItem, Select, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface MainLayoutProps {
  children: React.ReactNode;
  onHome?: () => void;
}

export default function MainLayout({ children, onHome }: MainLayoutProps) {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleChangeLang = (event: any) => {
    const lang = event.target.value;
    i18n.changeLanguage(lang);
    localStorage.setItem("lang", lang);
  };

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
          <Select
            value={currentLang}
            onChange={handleChangeLang}
            variant="outlined"
            size="small"
            sx={{
              bgcolor: "#fff",
              color: "#274549",
              fontWeight: 600,
              width: 80,
              "& .MuiOutlinedInput-notchedOutline": { border: "none" },
            }}
          >
            <MenuItem value="vi">
              <Box display="flex" alignItems="center" gap={1}>
                <img src="vn.png" width={18} height={14} alt="VN" />
                <Typography>VI</Typography>
              </Box>
            </MenuItem>
            <MenuItem value="en">
              <Box display="flex" alignItems="center" gap={1}>
                <img src="us.png" width={18} height={14} alt="EN" />
                <Typography>EN</Typography>
              </Box>
            </MenuItem>
          </Select>
        </Box>
      </Box>

      {/* Content */}
      <Box flex={1} display="flex" alignItems="center" justifyContent="center">
        {children}
      </Box>
    </Box>
  );
}
