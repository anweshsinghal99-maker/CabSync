"use client";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import type { PodMember } from "@/lib/types";
const hubIcon = L.divIcon({ className: "", html: '<div style="background:#f59e0b;border:3px solid #fff;border-radius:50%;width:16px;height:16px;box-shadow:0 0 15px #f59e0b"></div>', iconSize:[16,16], iconAnchor:[8,8] });
export default function RouteMapCanvas({ stops, route, members, hub }: { stops: [number,number][]; route: [number,number][]; members: PodMember[]; hub: string }) { return <MapContainer center={stops[0]} zoom={12} className="dark-map h-[330px] w-full"><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/><Polyline positions={route} pathOptions={{ color:"#10B981", weight:5, opacity:.9 }}/>{members.map((m,i) => <CircleMarker key={m.id} center={stops[i]} radius={8} pathOptions={{color:"#10B981", fillColor:"#10B981", fillOpacity:1}}><Popup>{m.name} · {m.hostel}</Popup></CircleMarker>)}<Marker position={stops[stops.length-1]} icon={hubIcon}><Popup>{hub}</Popup></Marker></MapContainer>; }
