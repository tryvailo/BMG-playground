'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@kit/ui/select';
import { Globe, MapPin, ChevronRight } from 'lucide-react';
import { cn } from '@kit/ui/utils';
import { getCitiesByCountryCode } from '~/lib/data/cities';
import { findClinicByUrl, findCompetitors, countClinicsInCity } from '~/lib/data/ukraine-clinics';

// Horizon UI Design Tokens
const HORIZON = {
    primary: '#4318FF',
    primaryLight: '#4318FF15',
    secondary: '#A3AED0',
    success: '#01B574',
    background: '#F4F7FE',
    textPrimary: '#1B2559',
    textSecondary: '#A3AED0',
};

// Countries with flags
const COUNTRIES = [
    { code: 'UA', name: 'Україна', flag: '🇺🇦', language: 'uk' },
    { code: 'US', name: 'United States', flag: '🇺🇸', language: 'en' },
    { code: 'UK', name: 'United Kingdom', flag: '🇬🇧', language: 'en' },
    { code: 'DE', name: 'Deutschland', flag: '🇩🇪', language: 'de' },
    { code: 'FR', name: 'France', flag: '🇫🇷', language: 'fr' },
    { code: 'PL', name: 'Polska', flag: '🇵🇱', language: 'pl' },
];

interface StepDomainGeoProps {
    onContinue: (data: {
        domain: string;
        region: string;
        city: string;
        language: string;
        clinicName?: string;
        competitors?: Array<{ name: string; url: string }>;
        totalClinicsInCity?: number;
    }) => void;
}

export function StepDomainGeo({ onContinue }: StepDomainGeoProps) {
    const [domain, setDomain] = useState('');
    const [region, setRegion] = useState('UA');
    const [city, setCity] = useState('');
    const [cities, setCities] = useState<{ name: string; countryCode: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isDetectingGeo, setIsDetectingGeo] = useState(false);

    // Load cities when region changes
    useEffect(() => {
        if (region) {
            const localCities = getCitiesByCountryCode(region);
            setCities(localCities);
            setCity(''); // Reset city when region changes
        }
    }, [region]);

    const cleanDomain = (input: string): string => {
        let cleaned = input.trim().toLowerCase();
        cleaned = cleaned.replace(/^https?:\/\//, '');
        cleaned = cleaned.replace(/^www\./, '');
        cleaned = cleaned.split('/')[0] ?? '';
        return cleaned;
    };

    const handleSubmit = async () => {
        const cleanedDomain = cleanDomain(domain);
        if (!cleanedDomain || !city) return;

        const country = COUNTRIES.find(c => c.code === region);
        const language = country?.language || 'en';

        setIsSearching(true);

        try {
            // For Ukraine, try to find clinic name and competitors
            if (region === 'UA') {
                const timeoutPromise = new Promise<never>((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout')), 10000)
                );

                try {
                    const [clinicName, competitors, totalClinicsInCity] = await Promise.race([
                        Promise.all([
                            findClinicByUrl(cleanedDomain),
                            findCompetitors(city, cleanedDomain),
                            countClinicsInCity(city)
                        ]),
                        timeoutPromise,
                    ]) as [string | null, Array<{ name: string; url: string }>, number];

                    onContinue({
                        domain: cleanedDomain,
                        region,
                        city,
                        language,
                        clinicName: clinicName || undefined,
                        competitors: competitors || [],
                        totalClinicsInCity: totalClinicsInCity || 0,
                    });
                    return;
                } catch {
                    // Continue without clinic data on error
                }
            }

            onContinue({
                domain: cleanedDomain,
                region,
                city,
                language,
            });
        } finally {
            setIsSearching(false);
        }
    };

    const isValid = domain.trim().length > 0 && city.length > 0;

    return (
        <div className="flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: HORIZON.textPrimary }}>
                Розкажіть про вашу клініку
            </h1>

            <p className="text-lg mb-10 leading-relaxed font-medium" style={{ color: HORIZON.textSecondary }}>
                Введіть домен вашого сайту та оберіть місто для аналізу видимості в AI-пошуку.
            </p>

            <div className="space-y-6 mb-10">
                {/* Domain Input */}
                <div className="space-y-2">
                    <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                        Домен сайту
                    </label>
                    <div className="relative">
                        <Globe 
                            size={20} 
                            className="absolute left-4 top-1/2 -translate-y-1/2"
                            style={{ color: HORIZON.primary }}
                        />
                        <Input
                            value={domain}
                            onChange={(e) => setDomain(e.target.value.toLowerCase())}
                            placeholder="yourclinic.com"
                            className="h-14 pl-12 rounded-xl font-semibold border-2 transition-all"
                            style={{
                                backgroundColor: 'white',
                                borderColor: domain ? HORIZON.primary + '50' : HORIZON.secondary + '30',
                                color: HORIZON.textPrimary
                            }}
                        />
                    </div>
                </div>

                {/* Region & City Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Region Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                            Країна
                        </label>
                        <Select value={region} onValueChange={setRegion} disabled={isDetectingGeo}>
                            <SelectTrigger
                                className="h-14 rounded-xl font-semibold px-4 border-2 transition-all"
                                style={{
                                    backgroundColor: 'white',
                                    borderColor: HORIZON.secondary + '30',
                                    color: HORIZON.textPrimary
                                }}
                            >
                                <SelectValue placeholder={isDetectingGeo ? "Визначаємо..." : "Оберіть країну"} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl shadow-xl">
                                {COUNTRIES.map((country) => (
                                    <SelectItem key={country.code} value={country.code} className="font-medium">
                                        {country.flag} {country.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* City Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold uppercase tracking-wider" style={{ color: HORIZON.textSecondary }}>
                            Місто
                        </label>
                        <div className="relative">
                            <Select value={city} onValueChange={setCity} disabled={cities.length === 0}>
                                <SelectTrigger
                                    className="h-14 rounded-xl font-semibold px-4 border-2 transition-all"
                                    style={{
                                        backgroundColor: 'white',
                                        borderColor: city ? HORIZON.primary + '50' : HORIZON.secondary + '30',
                                        color: HORIZON.textPrimary
                                    }}
                                >
                                    <SelectValue placeholder="Оберіть місто" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl shadow-xl max-h-[300px]">
                                    {cities.map((cityItem, idx) => (
                                        <SelectItem key={`${cityItem.name}-${idx}`} value={cityItem.name} className="font-medium">
                                            {cityItem.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Auto-detected hint */}
                {!isDetectingGeo && (
                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: HORIZON.success }}>
                        <MapPin size={12} />
                        Країну визначено автоматично. Ви можете змінити її вручну.
                    </p>
                )}
            </div>

            {/* Submit Button */}
            <Button
                disabled={!isValid || isSearching}
                onClick={handleSubmit}
                className={cn(
                    "w-full lg:w-fit px-12 py-6 text-lg rounded-xl transition-all flex items-center gap-3 font-semibold",
                    isValid && !isSearching
                        ? "text-white hover:-translate-y-0.5"
                        : "cursor-not-allowed opacity-50"
                )}
                style={{
                    backgroundColor: isValid && !isSearching ? HORIZON.primary : HORIZON.secondary,
                    boxShadow: isValid && !isSearching ? `0 15px 30px ${HORIZON.primary}30` : 'none'
                }}
            >
                {isSearching ? 'Аналізуємо...' : 'Аналізувати видимість'}
                {!isSearching && <ChevronRight size={20} />}
            </Button>
        </div>
    );
}

export function VisualDomainGeo() {
    return (
        <div
            className="rounded-[20px] shadow-2xl p-8 animate-in zoom-in-95 duration-700 w-full max-w-lg mx-auto"
            style={{
                backgroundColor: 'white',
                boxShadow: '0 25px 50px -12px rgba(67, 24, 255, 0.15)'
            }}
        >
            {/* Browser mockup */}
            <div className="flex items-center gap-2 mb-6 border-b pb-4" style={{ borderColor: HORIZON.background }}>
                <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EE5D50' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FFB547' }} />
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#01B574' }} />
                </div>
                <div className="h-6 rounded-lg w-full max-w-[200px] ml-4 flex items-center px-3" style={{ backgroundColor: HORIZON.background }}>
                    <span className="text-xs font-medium" style={{ color: HORIZON.textSecondary }}>yourclinic.com</span>
                </div>
            </div>

            {/* Content preview */}
            <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: HORIZON.primaryLight }} />
                    <div>
                        <div className="h-3 w-24 rounded" style={{ backgroundColor: HORIZON.background }} />
                        <div className="h-2 w-16 rounded mt-1" style={{ backgroundColor: HORIZON.background }} />
                    </div>
                </div>
                <div className="h-20 rounded-xl" style={{ backgroundColor: HORIZON.background }} />
                <div className="grid grid-cols-3 gap-2">
                    <div className="h-12 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                    <div className="h-12 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                    <div className="h-12 rounded-lg" style={{ backgroundColor: HORIZON.background }} />
                </div>
            </div>

            {/* Analysis indicators */}
            <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: HORIZON.background }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: HORIZON.success }} />
                    <span className="text-xs font-semibold" style={{ color: HORIZON.textSecondary }}>AI аналіз</span>
                </div>
                <div className="flex gap-1">
                    {[1, 2, 3].map(i => (
                        <div 
                            key={i}
                            className="w-1.5 h-4 rounded-full animate-pulse"
                            style={{ 
                                backgroundColor: HORIZON.primary,
                                animationDelay: `${i * 0.2}s`
                            }} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
