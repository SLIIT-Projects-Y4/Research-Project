// src/pages/PlanItinerary.jsx
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge, Button, Group, Paper, Text, Title, Timeline, Divider,
} from '@mantine/core';
import { MapPin, Flag, Route as RouteIcon, Star, Info } from 'lucide-react';
import { toast } from 'react-toastify';

function km(n) { return typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—'; }

export default function PlanItinerary() {
  const navigate = useNavigate();
  const location = useLocation();

  const payload = useMemo(() => {
    if (location.state && location.state.status === 'ok') return location.state;
    try {
      const raw = sessionStorage.getItem('lastPlan');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.status === 'ok' ? parsed : null;
    } catch { return null; }
  }, [location.state]);

  if (!payload) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-4">
          <Title order={2}>Itinerary</Title>
          <Paper p="lg">No plan loaded. Please generate a plan first.</Paper>
          <Button onClick={() => navigate('/plan/build')}>Go to Plan Builder</Button>
        </div>
      </div>
    );
  }

  const {
    itinerary = [],
    total_distance_km,
    province_corridor = [],
    is_day_trip,
    attractions_count,
    start,
    end,
    corridor_radius_km,
  } = payload;

  const openInMaps = (lat, lng, name) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      toast.info('No coordinates available'); return;
    }
    const url = `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(name || '')})`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const startProvince = start?.province || itinerary[0]?.province || 'Unknown Province';
  const endProvince = end?.province || itinerary[itinerary.length - 1]?.province || 'Unknown Province';

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-12">
        <div className="flex flex-col gap-2">
          <Title order={2}>Itinerary</Title>

          <Paper withBorder radius="lg" p="lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Text size="sm" c="dimmed">Start</Text>
                <Group gap="xs" wrap="nowrap">
                  <MapPin size={16} />
                  <Text fw={600}>{start?.name || itinerary[0]?.name || '—'}</Text>
                  <Button size="xs" variant="default" onClick={() => openInMaps(start?.lat ?? itinerary[0]?.lat, start?.lng ?? itinerary[0]?.lng, start?.name ?? itinerary[0]?.name)}>
                    Open in Maps
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  {startProvince ? `Province: ${startProvince}` : ''}
                </Text>
              </div>

              <div className="space-y-1">
                <Text size="sm" c="dimmed">End</Text>
                <Group gap="xs" wrap="nowrap">
                  <Flag size={16} />
                  <Text fw={600}>{end?.name || itinerary[itinerary.length - 1]?.name || '—'}</Text>
                  <Button size="xs" variant="default" onClick={() => openInMaps(end?.lat ?? itinerary[itinerary.length - 1]?.lat, end?.lng ?? itinerary[itinerary.length - 1]?.lng, end?.name ?? itinerary[itinerary.length - 1]?.name)}>
                    Open in Maps
                  </Button>
                </Group>
                <Text size="sm" c="dimmed">
                  {endProvince ? `Province: ${endProvince}` : ''}
                </Text>
              </div>

              <div className="space-y-2">
                <Text size="sm" c="dimmed">Trip summary</Text>
                <Group gap="xs">
                  <Badge variant="light" leftSection={<RouteIcon size={14} />}>
                    {km(total_distance_km)}
                  </Badge>
                  <Badge variant="light">{is_day_trip ? 'Day trip' : 'Multi-day'}</Badge>
                  <Badge variant="light">{attractions_count ?? 0} attractions</Badge>
                  <Badge variant="light">{corridor_radius_km} km corridor</Badge>
                </Group>
              </div>
            </div>

            {province_corridor?.length ? (
              <>
                <Divider my="md" />
                <div className="space-y-1">
                  <Text size="sm" c="dimmed">Province corridor</Text>
                  <Group gap="xs">
                    {province_corridor.map((p) => (
                      <Badge key={p} variant="outline">{p}</Badge>
                    ))}
                  </Group>
                </div>
              </>
            ) : null}
          </Paper>
        </div>

        <Paper withBorder radius="lg" p="lg">
          <Timeline bulletSize={22} lineWidth={2} active={itinerary.length}>
            {itinerary.map((item, idx) => {
              const hasCoords = typeof item.lat === 'number' && typeof item.lng === 'number';
              const distance = item.distance_from_prev;
              const bullet = (
                <div className="rounded-full bg-gray-100 p-1">
                  <RouteIcon size={14} />
                </div>
              );

              return (
                <Timeline.Item key={`${item.name}-${idx}`} bullet={bullet} title={
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Text fw={600}>{item.name}</Text>
                      {item.original_city_label && (
                        <Badge variant="outline" leftSection={<Info size={12} />}>
                          from city: {item.original_city_label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {typeof item.rating === 'number' && (
                        <Badge variant="light" leftSection={<Star size={12} />}>
                          {item.rating.toFixed(2)}
                        </Badge>
                      )}
                      {distance != null && (
                        <Badge variant="light">{km(distance)} from previous</Badge>
                      )}
                      {hasCoords && (
                        <Button size="xs" variant="default" onClick={() => openInMaps(item.lat, item.lng, item.name)}>
                          Open in Maps
                        </Button>
                      )}
                    </div>
                  </div>
                }>
                  <div className="mt-1 text-sm text-gray-700">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.type && <Badge variant="outline">{(item.type || '').toUpperCase()}</Badge>}
                      {(item.city || item.province) && (
                        <Text c="dimmed">
                          {item.city ? `${item.city}` : ''}{item.city && item.province ? ', ' : ''}{item.province || ''}
                        </Text>
                      )}
                    </div>
                  </div>
                </Timeline.Item>
              );
            })}
          </Timeline>
        </Paper>

        <div className="flex items-center justify-end gap-2">
          <Button variant="default" onClick={() => navigate('/plan/build')}>Back to Builder</Button>
          <Button
            onClick={() => {
              try {
                const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(file);
                const a = document.createElement('a');
                a.href = url; a.download = 'itinerary.json'; a.click();
                URL.revokeObjectURL(url);
              } catch { toast.error('Failed to export'); }
            }}
          >
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  );
}
