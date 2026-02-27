'use client';

import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.75rem'
};

const defaultCenter = {
    lat: -6.200000,
    lng: 106.816666 // Jakarta
};

interface MapPickerProps {
    lat: number | null;
    lng: number | null;
    onLocationSelect: (lat: number, lng: number) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onLocationSelect }) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map);
    }, []);

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null);
    }, []);

    const handleClick = (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            onLocationSelect(e.latLng.lat(), e.latLng.lng());
        }
    };

    const center = (lat && lng) ? { lat, lng } : defaultCenter;

    return isLoaded ? (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={handleClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
            }}
        >
            {lat && lng && (
                <Marker position={{ lat, lng }} />
            )}
        </GoogleMap>
    ) : (
        <div className="w-full h-[300px] bg-slate-100 flex items-center justify-center rounded-xl border border-slate-200">
            <p className="text-sm text-slate-500">Memuat Peta...</p>
        </div>
    );
};

export default React.memo(MapPicker);
