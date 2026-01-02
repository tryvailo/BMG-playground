'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@kit/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@kit/ui/select';
import type { City } from '~/lib/actions/cities';
import { getCitiesByCountryCode } from '~/lib/data/cities';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
};

interface StepCityProps {
    onContinue: (city: string) => void;
    countryCode: string;
}

export function StepCity({ onContinue, countryCode }: StepCityProps) {
    const [city, setCity] = useState('');
    const [cities, setCities] = useState<City[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Use local static data for all countries (including Ukraine)
        // This avoids server action errors and provides instant loading
        if (countryCode) {
            const localCities = getCitiesByCountryCode(countryCode);
            // Convert to City format
            const citiesData: City[] = localCities.map((city, index) => ({
                id: `local-${countryCode}-${index}`,
                name: city.name,
                country_code: city.countryCode,
            }));
            setCities(citiesData);
            setLoading(false);
        }
    }, [countryCode]);

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-6 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Which city are you located in?
            </h1>

            <p className="text-lg mb-10 leading-relaxed font-medium" style={{ color: HORIZON.textSecondary }}>
                Select your city to get location-specific insights and recommendations.
            </p>

            <div className="space-y-8 mb-12">
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>City</label>
                    <Select value={city} onValueChange={setCity} disabled={loading}>
                        <SelectTrigger
                            className="h-14 rounded-xl font-semibold px-4 border-2 transition-all"
                            style={{
                                backgroundColor: HORIZON.background,
                                borderColor: city ? HORIZON.primary + '30' : 'transparent',
                                color: HORIZON.textPrimary
                            }}
                        >
                            <SelectValue placeholder={loading ? "Loading cities..." : "Select city"} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl shadow-xl max-h-[300px]">
                            {cities.map((cityItem) => (
                                <SelectItem key={cityItem.id || cityItem.name} value={cityItem.name} className="font-medium">
                                    {cityItem.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Button
                onClick={() => onContinue(city)}
                disabled={!city || loading}
                className="w-full lg:w-fit px-12 py-6 text-lg text-white rounded-xl transition-all hover:-translate-y-0.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                    backgroundColor: HORIZON.primary,
                    boxShadow: city ? `0 15px 30px ${HORIZON.primary}30` : 'none'
                }}
            >
                Continue
            </Button>
        </div>
    );
}

export function VisualCity() {
    return (
        <div className="flex items-center justify-center animate-in zoom-in-95 duration-1000">
            <div className="relative w-[480px] h-[480px] opacity-40">
                <svg viewBox="0 0 100 100" className="w-full h-full" style={{ color: HORIZON.secondary }}>
                    {/* City skyline illustration */}
                    <rect x="10" y="60" width="8" height="30" fill="currentColor" opacity="0.3" />
                    <rect x="20" y="50" width="8" height="40" fill="currentColor" opacity="0.4" />
                    <rect x="30" y="45" width="8" height="45" fill="currentColor" opacity="0.5" />
                    <rect x="40" y="55" width="8" height="35" fill="currentColor" opacity="0.3" />
                    <rect x="50" y="40" width="8" height="50" fill="currentColor" opacity="0.6" />
                    <rect x="60" y="50" width="8" height="40" fill="currentColor" opacity="0.4" />
                    <rect x="70" y="45" width="8" height="45" fill="currentColor" opacity="0.5" />
                    <rect x="80" y="55" width="8" height="35" fill="currentColor" opacity="0.3" />
                    
                    {/* Windows */}
                    {[20, 30, 50, 60, 70].map((x, i) => (
                        <g key={i}>
                            <rect x={x + 1} y={55 + i * 5} width="2" height="2" fill="currentColor" opacity="0.6" />
                            <rect x={x + 5} y={55 + i * 5} width="2" height="2" fill="currentColor" opacity="0.6" />
                        </g>
                    ))}
                </svg>

                {/* Glow Effect with Horizon primary */}
                <div
                    className="absolute inset-0 rounded-full blur-3xl -z-10"
                    style={{ background: `linear-gradient(to top right, ${HORIZON.primary}15, transparent)` }}
                />
            </div>
        </div>
    );
}

