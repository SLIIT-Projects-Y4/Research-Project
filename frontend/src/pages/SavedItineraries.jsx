// src/pages/SavedItineraries.jsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActionIcon,
  Badge,
  Button,
  Card,
  Divider,
  Group,
  Modal,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Title,
  Timeline,
  Tooltip,
} from '@mantine/core';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { getItineraries, deleteItineraryByIndex } from '../api/itineraries';
import {
  MapPin,
  Route as RouteIcon,
  Star,
  Trash2,
  ExternalLink,
  CalendarClock,
  FolderKanban,
  Flag,
} from 'lucide-react';

function km(n) {
  return typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—';
}
function formatDate(d) {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return '—';
  }
}

export default function SavedItineraries() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [active, setActive] = useState(0);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const navigate = useNavigate();

  const activeDoc = useMemo(() => items?.[active] ?? null, [items, active]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getItineraries();
      const list = Array.isArray(res?.data) ? res.data : [];
      setItems(list);
      // keep active within bounds
      setActive((idx) => (idx < list.length ? idx : 0));
    } catch {
      toast.error('Failed to load itineraries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openInMaps = (lat, lng, name) => {
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      toast.info('No coordinates available');
      return;
    }
    const url = `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(name || '')})`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const toViewerPayload = (doc) => {
    const its = Array.isArray(doc.items) ? doc.items : [];
    const startItem = its[0] || null;
    const endItem = its[its.length - 1] || null;

    return {
      status: 'ok',
      itinerary: its.map((x) => ({
        name: x.name,
        lat: x.lat,
        lng: x.lng,
        type: x.type,
        province: x.province,
        city: x.city,
        rating: x.rating,
        distance_from_prev: x.distance_from_prev,
      })),
      total_distance_km: doc.total_distance_km,
      start: startItem
        ? { name: startItem.name, province: startItem.province, lat: startItem.lat, lng: startItem.lng }
        : null,
      end: endItem
        ? { name: endItem.name, province: endItem.province, lat: endItem.lat, lng: endItem.lng }
        : null,
      corridor_radius_km: doc.corridor_radius_km ?? null,
      attractions_count: its.length,
      is_day_trip: doc.is_day_trip ?? null,
    };
  };

  const onView = (doc) => {
    const payload = toViewerPayload(doc);
    sessionStorage.setItem('lastPlan', JSON.stringify(payload));
    navigate('/plan/itinerary', { state: payload });
  };

  const onExport = (doc) => {
    try {
      const file = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title || 'itinerary'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to export');
    }
  };

  const onConfirmDelete = async () => {
    try {
      setConfirmDeleteOpen(false);
      await deleteItineraryByIndex(active); // delete-by-index matches server
      setItems((prev) => {
        const next = prev.filter((_, i) => i !== active);
        return next;
      });
      setActive(0);
      toast.success('Deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex items-end justify-between">
            <div>
              <Title order={2} className="tracking-tight">Saved Plans</Title>
              <Text c="dimmed" size="sm">
                Your curated itineraries, neatly organized.
              </Text>
            </div>
            <Group gap="xs">
              <Button variant="default" onClick={() => navigate('/plan/build')}>
                Build New Plan
              </Button>
              <Tooltip label="List count">
                <Badge variant="light" leftSection={<FolderKanban size={14} />}>
                  {loading ? '—' : items.length}
                </Badge>
              </Tooltip>
            </Group>
          </div>

          {/* Master–Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: list */}
            <Paper withBorder radius="lg" p="sm" className="lg:col-span-4">
              <div className="px-2 py-1 flex items-center justify-between">
                <Text fw={600} size="sm" c="dimmed">Itineraries</Text>
                <Text size="xs" c="dimmed">{loading ? 'Loading…' : `${items.length} total`}</Text>
              </div>

              <Divider my="sm" />

              {loading ? (
                <div className="p-4 text-gray-600">Fetching saved plans…</div>
              ) : items.length === 0 ? (
                <div className="p-6 text-center text-gray-600">
                  You haven’t saved any itineraries yet.
                </div>
              ) : (
                <ScrollArea.Autosize mah={560} type="auto" offsetScrollbars>
                  <Stack gap="sm" className="pb-2">
                    {items.map((it, idx) => {
                      const activeStyle =
                        idx === active
                          ? 'border-blue-500/60 ring-2 ring-blue-100 shadow-md'
                          : 'border-transparent';
                      const total = it.total_distance_km;

                      return (
                        <Card
                          key={`${it.title}-${idx}`}
                          withBorder
                          radius="md"
                          className={`transition-all hover:shadow-sm cursor-pointer ${activeStyle}`}
                          onClick={() => setActive(idx)}
                        >
                          <Stack gap={6}>
                            <Group justify="space-between" wrap="nowrap">
                              <Text fw={600} className="truncate">{it.title || `Itinerary #${idx + 1}`}</Text>
                              <Tooltip label="Created at">
                                <Badge variant="outline" leftSection={<CalendarClock size={12} />}>
                                  {it.createdAt ? formatDate(it.createdAt) : '—'}
                                </Badge>
                              </Tooltip>
                            </Group>

                            <Group gap="xs" wrap="wrap">
                              {typeof total === 'number' && (
                                <Badge variant="light" leftSection={<RouteIcon size={14} />}>
                                  {total.toFixed(1)} km
                                </Badge>
                              )}
                              {it.corridor_radius_km && (
                                <Badge variant="light">{it.corridor_radius_km} km corridor</Badge>
                              )}
                              <Badge variant="outline">{(it.items || []).length} stops</Badge>
                            </Group>
                          </Stack>
                        </Card>
                      );
                    })}
                  </Stack>
                </ScrollArea.Autosize>
              )}
            </Paper>

            {/* Right: detail */}
            <div className="lg:col-span-8">
              {!activeDoc ? (
                <Paper withBorder radius="lg" p="xl" className="h-full flex items-center justify-center">
                  <Text c="dimmed">Select an itinerary from the list to view details.</Text>
                </Paper>
              ) : (
                <Paper withBorder radius="lg" p="lg" className="space-y-12">
                  {/* Summary */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Title order={3} className="tracking-tight truncate">{activeDoc.title}</Title>
                        <Group gap="xs" mt={6} wrap="wrap">
                          {typeof activeDoc.total_distance_km === 'number' && (
                            <Badge variant="light" leftSection={<RouteIcon size={14} />}>
                              {km(activeDoc.total_distance_km)}
                            </Badge>
                          )}
                          {activeDoc.corridor_radius_km && (
                            <Badge variant="light">{activeDoc.corridor_radius_km} km corridor</Badge>
                          )}
                          {Array.isArray(activeDoc.province_corridor) && activeDoc.province_corridor.length > 0 && (
                            <Badge variant="outline">
                              {activeDoc.province_corridor.join(' → ')}
                            </Badge>
                          )}
                          <Badge variant="outline">{(activeDoc.items || []).length} stops</Badge>
                        </Group>
                      </div>

                      <Group gap="xs">
                        <Tooltip label="Open in itinerary viewer">
                          <ActionIcon variant="default" onClick={() => onView(activeDoc)}>
                            <ExternalLink size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Export JSON">
                          <ActionIcon variant="default" onClick={() => onExport(activeDoc)}>
                            <FolderKanban size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Delete plan">
                          <ActionIcon
                            color="red"
                            variant="light"
                            onClick={() => setConfirmDeleteOpen(true)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </div>

                    {/* Start / End quick row */}
                    <Group gap="sm" mt="xs" wrap="wrap">
                      {activeDoc.items?.[0]?.name && (
                        <Badge variant="outline" leftSection={<MapPin size={12} />}>
                          {activeDoc.items[0].name}
                        </Badge>
                      )}
                      {activeDoc.items?.length > 1 && activeDoc.items?.[activeDoc.items.length - 1]?.name && (
                        <Badge variant="outline" leftSection={<Flag size={12} />}>
                          {activeDoc.items[activeDoc.items.length - 1].name}
                        </Badge>
                      )}
                    </Group>
                  </div>

                  <Divider />

                  {/* Full timeline */}
                  <div className="space-y-3">
                    <Text c="dimmed" size="sm" fw={600}>Route</Text>
                    <Timeline bulletSize={20} lineWidth={2} active={activeDoc.items?.length || 0}>
                      {(activeDoc.items || []).map((p, i) => {
                        const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
                        const bullet = (
                          <div className="rounded-full bg-gray-100 p-1">
                            <RouteIcon size={12} />
                          </div>
                        );
                        return (
                          <Timeline.Item
                            key={`${p.name}-${i}`}
                            bullet={bullet}
                            title={
                              <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0 flex items-center gap-2">
                                  <Text fw={600} className="truncate">{p.name}</Text>
                                  {p.type && <Badge variant="outline">{p.type}</Badge>}
                                  {(p.city || p.province) && (
                                    <Text c="dimmed" size="sm" className="truncate">
                                      {p.city ? `${p.city}` : ''}
                                      {p.city && p.province ? ', ' : ''}
                                      {p.province || ''}
                                    </Text>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {typeof p.rating === 'number' && (
                                    <Badge variant="light" leftSection={<Star size={12} />}>
                                      {p.rating.toFixed(2)}
                                    </Badge>
                                  )}
                                  {hasCoords && (
                                    <Button
                                      size="xs"
                                      variant="default"
                                      leftSection={<MapPin size={14} />}
                                      onClick={() => openInMaps(p.lat, p.lng, p.name)}
                                    >
                                      Maps
                                    </Button>
                                  )}
                                </div>
                              </div>
                            }
                          >
                            {/* Space for per-stop notes/times in future */}
                          </Timeline.Item>
                        );
                      })}
                    </Timeline>
                  </div>
                </Paper>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <Modal
        opened={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        title={<Text fw={700}>Delete itinerary</Text>}
        centered
      >
        <Text size="sm" c="dimmed" mb="md">
          This will permanently remove “{activeDoc?.title || 'Untitled'}”.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button color="red" onClick={onConfirmDelete} leftSection={<Trash2 size={14} />}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
}
