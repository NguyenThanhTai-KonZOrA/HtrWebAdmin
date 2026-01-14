import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { cityService, countryService, staffDeviceService } from '../services/registrationService';
import type { CityResponse, CountryResponse, CurrentStaffDeviceResponse } from '../registrationType';
import { signalRService } from '../services/signalRService';

interface AppDataContextType {
    cities: CityResponse[];
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
    const [cities, setCities] = useState<CityResponse[]>([]);
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

    const fetchCities = async () => {
        try {
            const data = await cityService.getCities();
            setCities(data);
        } catch (err) {
            console.error('Error fetching cities:', err);
            setError('Failed to load cities');
        }
    };

    const fetchStaffDevice = async () => {
        try {
            console.log('🔄 [AppDataContext] Fetching staff device...');
            const data = await staffDeviceService.getCurrentStaffDevice();
            console.log('✅ [AppDataContext] Staff device loaded:', data);
            console.log('📱 [AppDataContext] staffDeviceId:', data?.staffDeviceId);
            console.log('💻 [AppDataContext] deviceName:', data?.deviceName);
            setStaffDevice(data);

            // ✅ Initialize SignalR IMMEDIATELY after getting staffDevice from API
            if (data?.staffDeviceId && data?.deviceName) {
                console.log('🚀 [AppDataContext] Initializing SignalR with API data...');
                console.log('   staffDeviceId:', data.staffDeviceId);
                console.log('   deviceName:', data.deviceName);

                try {
                    await signalRService.startConnection(data.staffDeviceId, data.deviceName);
                    console.log('✅ [AppDataContext] SignalR initialized successfully');
                } catch (signalRError) {
                    console.error('❌ [AppDataContext] SignalR initialization failed:', signalRError);
                    // Don't throw - SignalR failure shouldn't block app loading
                }
            } else {
                console.warn('⚠️ [AppDataContext] No staffDeviceId or deviceName - skipping SignalR initialization');
            }
        } catch (err) {
            console.error('❌ [AppDataContext] Error fetching staff device:', err);
            setError('Failed to load staff device');
        }
    };

    useEffect(() => {
        const loadInitialData = async () => {
            console.log('🚀 [AppDataContext] Loading initial data...');
            setLoading(true);
            setError(null);

            await Promise.all([
                fetchCountries(),
                fetchCities(),
                fetchStaffDevice() // This now also initializes SignalR
            ]);

            setLoading(false);
            console.log('✅ [AppDataContext] Initial data loaded successfully');
        };

        loadInitialData();
    }, []);

    const value = {
        cities,
        countries,
        staffDevice,
        loading,
        error,
        refetchCities: fetchCities,
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
