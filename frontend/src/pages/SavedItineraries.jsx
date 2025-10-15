// src/pages/SavedItineraries.jsx
import React, {useEffect, useMemo, useState} from 'react';
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
import {toast} from 'react-toastify';
import {Link, useNavigate} from 'react-router-dom';
import {getItineraries, deleteItineraryByIndex} from '../api/itineraries';
import {
    MapPin,
    Route as RouteIcon,
    Star,
    Trash2,
    ExternalLink,
    CalendarClock,
    FolderKanban,
    Flag, Search, CalendarPlus, FolderIcon, PinIcon,MonitorPlay
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
              ? {name: startItem.name, province: startItem.province, lat: startItem.lat, lng: startItem.lng}
              : null,
            end: endItem
              ? {name: endItem.name, province: endItem.province, lat: endItem.lat, lng: endItem.lng}
              : null,
            corridor_radius_km: doc.corridor_radius_km ?? null,
            attractions_count: its.length,
            is_day_trip: doc.is_day_trip ?? null,
        };
    };

    const onView = (doc) => {
        const payload = toViewerPayload(doc);
        sessionStorage.setItem('lastPlan', JSON.stringify(payload));
        navigate('/plan/itinerary', {state: payload});
    };

    const onExport = (doc) => {
        try {
            // Extract location IDs from the itinerary items
            const locationIds = (doc.items || [])
              .filter(item => item.location_id !== null && item.location_id !== undefined)
              .map(item => item.location_id);

            // Prepare data for budget planning
            const budgetPlanningData = {
                itineraryTitle: doc.title || 'Untitled Itinerary',
                locationIds: locationIds,
                locations: doc.items || [],
                totalDistance: doc.total_distance_km,
                corridorRadius: doc.corridor_radius_km,
                createdAt: doc.createdAt
            };

            // Store in session storage for the budget planning page
            sessionStorage.setItem('budgetPlanningData', JSON.stringify(budgetPlanningData));

            // Navigate to budget planning page
            navigate('/budget-planning', {state: budgetPlanningData});

            toast.success('Navigating to budget planning...');
        } catch (error) {
            console.error('Failed to navigate to budget planning:', error);
            toast.error('Failed to navigate to budget planning');
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
          <div className="min-h-screen  mt-20 md:p-8">
              <div className="mx-auto max-w-6xl">
                  {/* Header */}
                  <div className="mb-6 flex items-end justify-between">
                      <div>
                          <div className="text-left mb-8">
                              <h1
                                className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
                                  Saved Plans
                              </h1>
                          </div>
                          <div className={`flex items-center justify-between gap-4`}>
                              <Link to="/plan/create">
                                  <button
                                    className="inline-flex items-center px-6 py-3 border border-brave-orange text-brave-orange hover:text-white font-semibold rounded-lg shadow-lg hover:bg-hot-embers transition-all duration-300 hover:cursor-pointer">
                                      <CalendarPlus className="w-5 h-5 mr-2"/>
                                      Generate New Plan
                                  </button>
                              </Link>
                              <div
                                className={`w-12 h-12 flex items-center justify-center rounded-full bg-yellow-400 font-display font-semibold text-xl text-white`}>
                                  {loading ? '—' : items.length}
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Master–Detail */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: list */}
                      <Paper withBorder radius="lg" p="sm" className="lg:col-span-4">
                          <div className="px-2 py-1 flex items-center justify-center">
                              <div
                                className={`font-display font-semibold text-lg text-center text-midnight-dreams`}>Saved
                                  Plan List
                              </div>
                          </div>

                          <Divider my="sm"/>

                          {loading ? (
                            <div className="p-4 text-gray-600">Fetching saved plans…</div>
                          ) : items.length === 0 ? (
                            <div className="p-6 text-center text-gray-600">
                                You haven’t saved any itineraries yet.
                            </div>
                          ) : (
                            <ScrollArea.Autosize mah={680} mih={460} type="auto" offsetScrollbars>
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
                                                  <div className={''}>
                                                      <div
                                                        className="font-display text-sm">{it.title || `Itinerary #${idx + 1}`}</div>
                                                  </div>

                                                  <Group gap="xs" wrap="wrap">
                                                      {typeof total === 'number' && (
                                                        <div
                                                          className={`py-1. px-4 border border-midnight-dreams font-display text-[12px] rounded-sm`}>
                                                            {total.toFixed(1)} km
                                                        </div>
                                                      )}
                                                      {it.corridor_radius_km && (
                                                        <Badge variant="light">{it.corridor_radius_km} km
                                                            corridor</Badge>
                                                      )}
                                                      <Badge variant="outline" radius={'sm'}
                                                             color={'orange'}>{(it.items || []).length} stops</Badge>
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
                                <div className="flex flex-col pb-5 gap-2 border-b border-b-heart-of-ice">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div
                                              className={`font-display font-semibold text-lg text-fly-by-night`}>{activeDoc.title}</div>
                                            <Group gap="xs" mt={6} wrap="wrap">
                                                {typeof activeDoc.total_distance_km === 'number' && (
                                                  <div
                                                    className={`py-0.5 px-4 bg-heart-of-ice rounded-md font-display font-medium text-sm text-midnight-dreams`}>
                                                      {km(activeDoc.total_distance_km)}
                                                  </div>
                                                )}
                                                {activeDoc.corridor_radius_km && (
                                                  <Badge variant="light">{activeDoc.corridor_radius_km} km
                                                      corridor</Badge>
                                                )}
                                                {Array.isArray(activeDoc.province_corridor) && activeDoc.province_corridor.length > 0 && (
                                                  <Badge variant="outline">
                                                      {activeDoc.province_corridor.join(' → ')}
                                                  </Badge>
                                                )}
                                                <div
                                                  className={`py-0.5 px-4 bg-yellow-400 rounded-md font-display font-medium text-sm text-white`}>
                                                    {(activeDoc.items || []).length} stops
                                                </div>
                                            </Group>
                                        </div>

                                        <Group gap="xs">
                                            <Tooltip label="Create Budget">
                                                <ActionIcon variant="default" onClick={() => onExport(activeDoc)}>
                                                    <MonitorPlay size={16}/>
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Delete plan">
                                                <ActionIcon
                                                  color="red"
                                                  variant="light"
                                                  onClick={() => setConfirmDeleteOpen(true)}
                                                >
                                                    <Trash2 size={16}/>
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </div>

                                    {/* Start / End quick row */}
                                    <Group gap="sm" mt="xs" wrap="wrap">
                                        {activeDoc.items?.[0]?.name && (
                                          <div
                                            className={`font-display font-normal text-sm py-1 px-3 bg-desert-lilly rounded-sm`}>
                                              FROM - {activeDoc.items[0].name}
                                          </div>
                                        )}
                                        {activeDoc.items?.length > 1 && activeDoc.items?.[activeDoc.items.length - 1]?.name && (
                                          <div
                                            className={`font-display font-normal text-sm py-1 px-3 bg-desert-lilly rounded-sm`}>
                                              TO - {activeDoc.items[activeDoc.items.length - 1].name}
                                          </div>
                                        )}
                                    </Group>
                                </div>

                                {/* Full timeline */}
                                <div className="space-y-5">
                                    <div
                                      className={`font-display font-semibold text-xl text-midnight-dreams underline`}>Plan
                                        Route
                                    </div>
                                    <Timeline bulletSize={20} lineWidth={2} active={activeDoc.items?.length || 0}>
                                        {(activeDoc.items || []).map((p, i) => {
                                            const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
                                            const bullet = (
                                              <div className="rounded-full bg-midnight-dreams/70 p-1">
                                                  <PinIcon size={12}/>
                                              </div>
                                            );
                                            return (
                                              <Timeline.Item
                                                key={`${p.name}-${i}`}
                                                bullet={bullet}
                                                title={
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex items-center gap-2">
                                                            <div className={`font-display font-normal`}>{p.name}</div>
                                                            {p.type && <div
                                                              className={`py-1 px-3 border border-brave-orange font-display font-thin text-[12px] text-brave-orange rounded-sm`}>{p.type}</div>}
                                                            {(p.city || p.province) && (
                                                              <div
                                                                className={`py-1 px-3 border border-ocean-depths font-display font-thin text-[12px] text-ocean-depths rounded-sm`}>
                                                                  {p.city ? `${p.city}` : ''}
                                                                  {p.city && p.province ? ', ' : ''}
                                                                  {p.province || ''}
                                                              </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {typeof p.rating === 'number' && (
                                                              <Badge variant="light" leftSection={<Star size={12}/>}>
                                                                  {p.rating.toFixed(2)}
                                                              </Badge>
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
                  <Button color="red" onClick={onConfirmDelete} leftSection={<Trash2 size={14}/>}>
                      Delete
                  </Button>
              </Group>
          </Modal>
      </>
    );
}
