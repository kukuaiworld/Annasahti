"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin,
  Navigation,
  AlertTriangle,
  Info,
  Clock,
  Compass,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { loadGoogleMapsApi } from "@/lib/maps/googleMapsLoader";

export interface LocationPoint {
  name: string;
  address?: string;
  lat: number | null;
  lng: number | null;
}

export interface VolunteerPoint {
  name?: string;
  lat: number | null;
  lng: number | null;
  updatedAt?: string | null;
}

export interface RouteTelemetry {
  distanceKm: number;
  durationText: string;
  durationSeconds: number;
  summary?: string;
}

interface GoogleDeliveryMapProps {
  donor: LocationPoint;
  recipient: LocationPoint;
  volunteer?: VolunteerPoint;
  height?: string;
  className?: string;
  onRouteCalculated?: (telemetry: RouteTelemetry) => void;
}

export default function GoogleDeliveryMap({
  donor,
  recipient,
  volunteer,
  height = "420px",
  className = "",
  onRouteCalculated,
}: GoogleDeliveryMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const geodesicPolylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const [mapLoaded, setMapLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [routeTelemetry, setRouteTelemetry] = useState<RouteTelemetry | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const isKeyConfigured = Boolean(
    apiKey && !apiKey.includes("your-") && apiKey.trim().length > 0
  );

  const hasDonorCoords =
    donor.lat !== null &&
    donor.lng !== null &&
    Number.isFinite(donor.lat) &&
    Number.isFinite(donor.lng);

  const hasRecipientCoords =
    recipient.lat !== null &&
    recipient.lng !== null &&
    Number.isFinite(recipient.lat) &&
    Number.isFinite(recipient.lng);

  const hasVolunteerCoords =
    volunteer &&
    volunteer.lat !== null &&
    volunteer.lng !== null &&
    Number.isFinite(volunteer.lat) &&
    Number.isFinite(volunteer.lng);

  // Initialize Map
  const initMap = useCallback(async () => {
    if (!mapContainerRef.current) return;
    if (!isKeyConfigured) return;

    try {
      const maps = await loadGoogleMapsApi();
      setLoadError(null);

      // Determine center point
      let defaultCenter = { lat: 28.6139, lng: 77.209 }; // default center
      if (hasDonorCoords) {
        defaultCenter = { lat: donor.lat!, lng: donor.lng! };
      } else if (hasRecipientCoords) {
        defaultCenter = { lat: recipient.lat!, lng: recipient.lng! };
      }

      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new maps.Map(mapContainerRef.current, {
          center: defaultCenter,
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true,
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });
      }

      const map = mapInstanceRef.current;

      // Clear existing markers & overlays
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        directionsRendererRef.current = null;
      }

      if (geodesicPolylineRef.current) {
        geodesicPolylineRef.current.setMap(null);
        geodesicPolylineRef.current = null;
      }

      const bounds = new maps.LatLngBounds();

      // Donor Marker (Pickup)
      if (hasDonorCoords) {
        const donorPos = { lat: donor.lat!, lng: donor.lng! };
        bounds.extend(donorPos);

        const donorMarker = new maps.Marker({
          position: donorPos,
          map,
          title: `Pickup: ${donor.name}`,
          label: {
            text: "P",
            color: "#ffffff",
            fontWeight: "bold",
          },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: "#059669", // emerald-600
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const donorInfo = new maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 4px; font-size: 12px; color: #1e293b;">
              <strong style="color: #059669; font-size: 13px;">Pickup Dock (Donor)</strong>
              <div style="font-weight: bold; margin-top: 2px;">${donor.name}</div>
              ${donor.address ? `<div style="color: #64748b; margin-top: 2px;">${donor.address}</div>` : ""}
              <div style="font-family: monospace; font-size: 10px; color: #94a3b8; margin-top: 4px;">
                Lat: ${donor.lat?.toFixed(5)}, Lng: ${donor.lng?.toFixed(5)}
              </div>
            </div>
          `,
        });

        donorMarker.addListener("click", () => {
          donorInfo.open(map, donorMarker);
        });

        markersRef.current.push(donorMarker);
      }

      // Recipient Marker (Dropoff)
      if (hasRecipientCoords) {
        const recipPos = { lat: recipient.lat!, lng: recipient.lng! };
        bounds.extend(recipPos);

        const recipientMarker = new maps.Marker({
          position: recipPos,
          map,
          title: `Dropoff: ${recipient.name}`,
          label: {
            text: "D",
            color: "#ffffff",
            fontWeight: "bold",
          },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 16,
            fillColor: "#7c3aed", // purple-600
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const recipInfo = new maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 4px; font-size: 12px; color: #1e293b;">
              <strong style="color: #7c3aed; font-size: 13px;">Dropoff Dock (Recipient)</strong>
              <div style="font-weight: bold; margin-top: 2px;">${recipient.name}</div>
              ${recipient.address ? `<div style="color: #64748b; margin-top: 2px;">${recipient.address}</div>` : ""}
              <div style="font-family: monospace; font-size: 10px; color: #94a3b8; margin-top: 4px;">
                Lat: ${recipient.lat?.toFixed(5)}, Lng: ${recipient.lng?.toFixed(5)}
              </div>
            </div>
          `,
        });

        recipientMarker.addListener("click", () => {
          recipInfo.open(map, recipientMarker);
        });

        markersRef.current.push(recipientMarker);
      }

      // Volunteer Marker (Live Courier Position)
      if (hasVolunteerCoords) {
        const volPos = { lat: volunteer!.lat!, lng: volunteer!.lng! };
        bounds.extend(volPos);

        const volMarker = new maps.Marker({
          position: volPos,
          map,
          title: volunteer!.name || "Volunteer Courier",
          label: {
            text: "V",
            color: "#ffffff",
            fontWeight: "bold",
          },
          icon: {
            path: maps.SymbolPath.CIRCLE,
            scale: 14,
            fillColor: "#2563eb", // blue-600
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        });

        const volInfo = new maps.InfoWindow({
          content: `
            <div style="font-family: sans-serif; padding: 4px; font-size: 12px; color: #1e293b;">
              <strong style="color: #2563eb; font-size: 13px;">Volunteer Courier (Live)</strong>
              <div style="font-weight: bold; margin-top: 2px;">${volunteer!.name || "Assigned Courier"}</div>
              <div style="font-family: monospace; font-size: 10px; color: #94a3b8; margin-top: 4px;">
                Lat: ${volunteer!.lat?.toFixed(5)}, Lng: ${volunteer!.lng?.toFixed(5)}
              </div>
              ${
                volunteer!.updatedAt
                  ? `<div style="font-size: 10px; color: #64748b; margin-top: 2px;">Updated: ${new Date(
                      volunteer!.updatedAt
                    ).toLocaleTimeString()}</div>`
                  : ""
              }
            </div>
          `,
        });

        volMarker.addListener("click", () => {
          volInfo.open(map, volMarker);
        });

        markersRef.current.push(volMarker);
      }

      // Route Calculation via DirectionsService
      if (hasDonorCoords && hasRecipientCoords) {
        const directionsService = new maps.DirectionsService();
        directionsRendererRef.current = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true, // Use our custom markers with InfoWindows
          polylineOptions: {
            strokeColor: "#2563eb",
            strokeOpacity: 0.85,
            strokeWeight: 5,
          },
        });

        directionsService.route(
          {
            origin: { lat: donor.lat!, lng: donor.lng! },
            destination: { lat: recipient.lat!, lng: recipient.lng! },
            travelMode: maps.TravelMode.DRIVING,
          },
          (result: any, status: any) => {
            if (status === maps.DirectionsStatus.OK && result) {
              directionsRendererRef.current.setDirections(result);
              setRouteError(null);

              const primaryLeg = result.routes[0]?.legs[0];
              if (primaryLeg) {
                const distanceKm = primaryLeg.distance
                  ? primaryLeg.distance.value / 1000.0
                  : 0;
                const durationText = primaryLeg.duration?.text || "Unknown";
                const durationSeconds = primaryLeg.duration?.value || 0;
                const summary = result.routes[0]?.summary || undefined;

                const telemetry: RouteTelemetry = {
                  distanceKm: Math.round(distanceKm * 10) / 10,
                  durationText,
                  durationSeconds,
                  summary,
                };
                setRouteTelemetry(telemetry);
                if (onRouteCalculated) {
                  onRouteCalculated(telemetry);
                }
              }
            } else {
              setRouteError(`Road routing unavailable (${status}).`);
              setRouteTelemetry(null);

              // Draw direct geodesic dashed polyline as fallback
              geodesicPolylineRef.current = new maps.Polyline({
                path: [
                  { lat: donor.lat!, lng: donor.lng! },
                  { lat: recipient.lat!, lng: recipient.lng! },
                ],
                geodesic: true,
                strokeColor: "#94a3b8",
                strokeOpacity: 0.8,
                strokeWeight: 3,
                map,
              });
            }
          }
        );
      } else {
        setRouteTelemetry(null);
        setRouteError("Both donor and recipient coordinates are required for route calculation.");
      }

      // Fit map viewport to include markers
      if (markersRef.current.length > 1) {
        map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
      } else if (markersRef.current.length === 1) {
        map.setCenter(markersRef.current[0].getPosition());
        map.setZoom(14);
      }

      setMapLoaded(true);
    } catch (err: any) {
      setLoadError(err.message || "Failed to initialize Google Maps");
      setMapLoaded(false);
    }
  }, [
    isKeyConfigured,
    hasDonorCoords,
    hasRecipientCoords,
    hasVolunteerCoords,
    donor.lat,
    donor.lng,
    donor.name,
    donor.address,
    recipient.lat,
    recipient.lng,
    recipient.name,
    recipient.address,
    volunteer?.lat,
    volunteer?.lng,
    volunteer?.name,
    volunteer?.updatedAt,
    onRouteCalculated,
  ]);

  useEffect(() => {
    initMap();
  }, [initMap]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Telemetry Bar (Shown when real route is calculated by Google) */}
      {routeTelemetry && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Driving Distance</span>
              <strong className="text-sm font-extrabold text-blue-700">
                {routeTelemetry.distanceKm} km
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Google Traffic ETA</span>
              <strong className="text-sm font-extrabold text-purple-700">
                {routeTelemetry.durationText}
              </strong>
            </div>
          </div>

          {routeTelemetry.summary && (
            <div className="col-span-2 sm:col-span-1 flex items-center gap-2 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Via Highway / Road</span>
                <span className="text-xs font-semibold text-slate-700 truncate block max-w-[140px]">
                  {routeTelemetry.summary}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warnings & Missing Data Handlers */}
      {(!hasDonorCoords || !hasRecipientCoords) && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <strong>Missing Geographic Coordinates in PostgreSQL</strong>
            <p className="text-amber-800">
              {!hasDonorCoords && !hasRecipientCoords
                ? "Both donor and recipient organisations are missing WGS84 coordinates in the database."
                : !hasDonorCoords
                ? `Donor organisation "${donor.name}" has no registered coordinates in PostgreSQL.`
                : `Recipient organisation "${recipient.name}" has no registered coordinates in PostgreSQL.`}
              {" "}Update organisation profiles with valid latitude and longitude to enable interactive route plotting.
            </p>
          </div>
        </div>
      )}

      {routeError && hasDonorCoords && hasRecipientCoords && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>{routeError} Displaying direct straight-line distance instead.</span>
        </div>
      )}

      {/* Unconfigured API Key Explanatory Card */}
      {!isKeyConfigured && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-sm text-white">Google Maps API Integration Ready</h4>
              <p className="text-xs text-slate-300">
                To render real interactive Google Maps and live Google Routes turn-by-turn geometry, configure your Google Maps API key in:
              </p>
              <code className="inline-block bg-slate-800 px-2 py-1 rounded text-emerald-400 font-mono text-[11px] mt-1">
                frontend/.env.local: NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=&lt;YOUR_KEY&gt;
              </code>
            </div>
          </div>

          {/* Real Operational Coordinates from PostgreSQL */}
          <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700/60 space-y-2 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Database Geographic Data (PostgreSQL / PostGIS)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                <span className="text-[10px] text-emerald-400 font-bold block">1. Pickup (Donor)</span>
                <strong className="text-white block mt-0.5">{donor.name}</strong>
                <div className="font-mono text-[11px] text-slate-400 mt-1">
                  {hasDonorCoords ? (
                    `Lat: ${donor.lat?.toFixed(5)}, Lng: ${donor.lng?.toFixed(5)}`
                  ) : (
                    <span className="text-amber-400 font-sans">No coordinates saved in DB</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40">
                <span className="text-[10px] text-purple-400 font-bold block">2. Dropoff (Recipient)</span>
                <strong className="text-white block mt-0.5">{recipient.name}</strong>
                <div className="font-mono text-[11px] text-slate-400 mt-1">
                  {hasRecipientCoords ? (
                    `Lat: ${recipient.lat?.toFixed(5)}, Lng: ${recipient.lng?.toFixed(5)}`
                  ) : (
                    <span className="text-amber-400 font-sans">No coordinates saved in DB</span>
                  )}
                </div>
              </div>
            </div>

            {hasVolunteerCoords && (
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700/40 flex items-center justify-between text-xs">
                <span className="text-blue-400 font-bold">Volunteer Courier Location:</span>
                <span className="font-mono text-slate-300">
                  Lat: {volunteer!.lat?.toFixed(5)}, Lng: {volunteer!.lng?.toFixed(5)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Google Map Canvas (when key configured) */}
      {isKeyConfigured && (
        <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
          {loadError && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-2">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h4 className="font-bold text-sm text-slate-900">Map Loading Error</h4>
              <p className="text-xs text-slate-600 max-w-md">{loadError}</p>
            </div>
          )}

          <div
            ref={mapContainerRef}
            style={{ width: "100%", height }}
            className="w-full rounded-3xl"
          />
        </div>
      )}
    </div>
  );
}
