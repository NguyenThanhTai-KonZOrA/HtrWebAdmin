import { useMemo } from "react";

export function useIsAdmin() {
    const role = useMemo(() => localStorage.getItem("userRole"), []);
    return role === "admin";
}