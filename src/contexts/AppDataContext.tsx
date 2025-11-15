import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { countryService, staffDeviceService } from '../services/registrationService';
import type { CountryResponse, CurrentStaffDeviceResponse } from '../registrationType';

interface AppDataContextType {
    countries: CountryResponse[];
    staffDevice: CurrentStaffDeviceResponse | null;
    loading: boolean;
    error: string | null;
    refetchCountries: () => Promise<void>;
    refetchStaffDevice: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [countries, setCountries] = useState<CountryResponse[]>([]);
    const [staffDevice, setStaffDevice] = useState<CurrentStaffDeviceResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCountries = async () => {
        try {
            const data = await countryService.getCountries();
            setCountries(data);
        } catch (err) {
            console.error('Error fetching countries:', err);
            setError('Failed to load countries');
        }
    };

    const fetchStaffDevice = async () => {
        try {
            const data = await staffDeviceService.getCurrentStaffDevice();
            setStaffDevice(data);
        } catch (err) {
            console.error('Error fetching staff device:', err);
            setError('Failed to load staff device');
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            setError(null);
            
            await Promise.all([
                fetchCountries(),
                fetchStaffDevice()
            ]);
            
            setLoading(false);
        };

        loadInitialData();
    }, []);

    const value = {
        countries,
        staffDevice,
        loading,
        error,
        refetchCountries: fetchCountries,
        refetchStaffDevice: fetchStaffDevice
    };

    return (
        <AppDataContext.Provider value={value}>
            {children}
        </AppDataContext.Provider>
    );
};

export const useAppData = () => {
    const context = useContext(AppDataContext);
    if (context === undefined) {
        throw new Error('useAppData must be used within an AppDataProvider');
    }
    return context;
};
