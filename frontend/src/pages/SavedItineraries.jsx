// src/pages/SavedItineraries.jsx
import React, {useEffect, useMemo, useState, useCallback} from 'react';
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
} from '@mantine/core';
import {useViewportSize} from '@mantine/hooks';
import {toast} from 'react-toastify';
import {Link, useNavigate} from 'react-router-dom';
import {getItineraries, deleteItineraryByIndex} from '../api/itineraries';
import {Star, Trash2, CalendarPlus, ExternalLink, Eye, DollarSign} from 'lucide-react';
import dayjs from 'dayjs';

/* ---------- helpers ---------- */

function km(n) {
    return typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—';
}

/** 1) Keep only before '('  2) Replace connectors (->, →, to, and) with neutral '•'  3) Collapse spaces */
function cleanPlanTitle(raw) {
    if (!raw || typeof raw !== 'string') return 'Untitled Itinerary';
    const beforeParen = raw.split('(')[0] || raw;
    const replaced = beforeParen
      .replace(/->|→/g, ' • ')
      .replace(/\bto\b/gi, ' • ')
      .replace(/\band\b/gi, ' • ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s*•\s*/g, ' • ')
      .trim();
    return replaced || 'Untitled Itinerary';
}

export default function SavedItineraries() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [active, setActive] = useState(0);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

    const navigate = useNavigate();
    const activeDoc = useMemo(() => items?.[active] ?? null, [items, active]);

    // Viewport-aware breakpoints
    const {width} = useViewportSize();
    const isXS = width < 480;
    const isSM = width < 640;
    const isMD = width < 992;
    const isLG = width < 1280;

    // Layout tokens derived from width
    const tokens = useMemo(() => {
        return {
            pagePadding: isXS ? 12 : isSM ? 16 : isMD ? 20 : 28,
            containerMaxWidth: 1120, // ~max-w-6xl
            titleSize: isXS ? 24 : isSM ? 32 : isMD ? 36 : 40,
            headerGap: isXS ? 8 : 12,
            listHeight: isXS ? '52vh' : isSM ? '56vh' : isMD ? '60vh' : '64vh',
            routeHeight: isXS ? '48vh' : isSM ? '52vh' : isMD ? '56vh' : '60vh',
            gridGap: isXS ? 12 : isSM ? 14 : isMD ? 18 : 20,
            leftColWidth: isMD ? '100%' : '36%', // master list width on desktop
            rightColWidth: isMD ? '100%' : '64%',
            stickyTop: isXS ? 0 : 6,
            smallText: isXS ? 11 : 12,
            baseText: isXS ? 13 : 14,
            chipText: isXS ? 10 : 11,
            buttonSize: isXS ? 'xs' : 'xs',
        };
    }, [isXS, isSM, isMD]);

    const load = async () => {
        try {
            setLoading(true);
            const res = await getItineraries();
            const list = Array.isArray(res?.data) ? res.data : [];
            setItems(list);
            setActive((idx) => (idx < list.length ? idx : 0));
        } catch {
            toast.error('Failed to load itineraries');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openInMaps = (lat, lng, name) => {
        if (typeof lat !== 'number' || typeof lng !== 'number') {
            toast.info('No coordinates available');
            return;
        }
        const url = `https://www.google.com/maps?q=${lat},${lng}(${encodeURIComponent(name || '')})`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const formatDate = (date) => {
        return dayjs(date).format('D MMMM YYYY');
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
                location_id: x.location_id,
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
            createdAt: doc.createdAt,
            title: doc.title,
        };
    };

    const onView = useCallback(
      (doc) => {
          const payload = toViewerPayload(doc);
          sessionStorage.setItem('lastPlan', JSON.stringify(payload));
          navigate('/plan/itinerary', {state: payload});
      },
      [navigate]
    );

    const onExport = useCallback(
      (doc) => {
          try {
              const locationIds =
                (doc.items || [])
                  .filter((item) => item.location_id !== null && item.location_id !== undefined)
                  .map((item) => item.location_id) || [];

              const budgetPlanningData = {
                  itineraryTitle: doc.title || 'Untitled Itinerary',
                  locationIds,
                  locations: doc.items || [],
                  totalDistance: doc.total_distance_km,
                  corridorRadius: doc.corridor_radius_km,
                  createdAt: doc.createdAt,
              };

              sessionStorage.setItem('budgetPlanningData', JSON.stringify(budgetPlanningData));
              navigate('/budget-planning', {state: budgetPlanningData});
              toast.success('Navigating to budget planning...');
          } catch (error) {
              console.error('Failed to navigate to budget planning:', error);
              toast.error('Failed to navigate to budget planning');
          }
      },
      [navigate]
    );

    const onConfirmDelete = async () => {
        try {
            setConfirmDeleteOpen(false);
            await deleteItineraryByIndex(active);
            setItems((prev) => prev.filter((_, i) => i !== active));
            setActive(0);
            toast.success('Deleted');
        } catch {
            toast.error('Failed to delete');
        }
    };

    return (
      <>
          {/* Page wrapper */}
          <div
            style={{
                minHeight: '100vh',
                marginTop: 80,
                padding: isMD ? tokens.pagePadding : `${tokens.pagePadding}px`,
                background: 'transparent',
            }}
          >
              {/* Centered container */}
              <div
                style={{
                    margin: '0 auto',
                    maxWidth: tokens.containerMaxWidth,
                }}
              >
                  {/* Header */}
                  <div style={{marginBottom: 24}}>
                      <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: tokens.headerGap,
                            marginBottom: 16,
                        }}
                      >
                          <div style={{display: 'flex', alignItems: 'center', gap: tokens.headerGap}}>
                              <h1
                                className="font-display text-3xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
                                  Saved Plans
                              </h1>
                          </div>
                          <div className={`flex items-center justify-between gap-4`}>
                              <Link to="/plan/create">
                                  <button
                                    className="inline-flex items-center px-4 py-2 text-base border border-brave-orange text-brave-orange hover:text-white font-semibold rounded-lg shadow-lg hover:bg-hot-embers transition-all duration-300 hover:cursor-pointer">
                                      <CalendarPlus className="w-5 h-5 mr-2"/>
                                      Generate New Plan
                                  </button>
                              </Link>
                          </div>
                      </div>
                  </div>

                  {/* Master–Detail grid (pure styles) */}
                  <div
                    style={{
                        display: 'flex',
                        flexDirection: isMD ? 'column' : 'row',
                        gap: tokens.gridGap,
                        alignItems: 'stretch',
                        width: '100%',
                    }}
                  >
                      {/* LEFT: Saved Plan List */}
                      <Paper
                        withBorder
                        radius="lg"
                        p="sm"
                        style={{
                            width: isMD ? '100%' : tokens.leftColWidth,
                            minWidth: 0,
                            borderColor: 'var(--color-heart-of-ice, #E6F2FF)',
                        }}
                      >
                          <div
                            style={{
                                paddingInline: 8,
                                paddingBlock: 4,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}
                          >
                              <div
                                style={{
                                    fontFamily: 'var(--font-display, Poppins)',
                                    fontWeight: 600,
                                    fontSize: 14,
                                    color: 'var(--color-midnight-dreams, #001C33)',
                                }}
                              >
                                  Saved Plan List
                              </div>
                          </div>

                          <Divider my="sm"/>

                          {loading ? (
                            <div style={{padding: 12, color: '#666'}}>Fetching saved plans…</div>
                          ) : items.length === 0 ? (
                            <div style={{padding: 16, textAlign: 'center', color: '#666'}}>
                                You haven't saved any itineraries yet.
                            </div>
                          ) : (
                            <ScrollArea.Autosize mah={tokens.listHeight} type="auto" offsetScrollbars>
                                <Stack gap="xs" style={{paddingBottom: 8}}>
                                    {items.map((it, idx) => {
                                        const isActive = idx === active;
                                        const title = cleanPlanTitle(it.title);
                                        const stops = (it.items || []).length;
                                        const total = it.total_distance_km;

                                        return (
                                          <Card
                                            key={`${it.title || 'it'}-${idx}`}
                                            withBorder
                                            radius="md"
                                            onClick={() => setActive(idx)}
                                            style={{
                                                cursor: 'pointer',
                                                transition: 'box-shadow 120ms, border-color 120ms, background 120ms',
                                                borderColor: isActive
                                                  ? 'rgba(253,102,30,0.6)'
                                                  : 'rgba(230,242,255,0.9)',
                                                background: isActive ? 'rgba(253,102,30,0.06)' : 'transparent',
                                            }}
                                          >
                                              <div style={{
                                                  display: 'flex',
                                                  alignItems: 'flex-start',
                                                  justifyContent: 'space-between',
                                                  gap: 12
                                              }}>
                                                  {/* Title and micro meta */}
                                                  <div style={{minWidth: 0}}>
                                                      <div
                                                        style={{
                                                            fontFamily: 'var(--font-display, Poppins)',
                                                            fontSize: tokens.baseText,
                                                            color: 'var(--color-midnight-dreams, #001C33)',
                                                            lineHeight: 1.25,
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                        }}
                                                      >
                                                          {title}
                                                      </div>

                                                      {/* Saved time/date chip */}
                                                      <div style={{marginTop: 4}} className={`font-display font-medium text-sm text-midnight-dreams`}>
                                                          <div className={`text-semibold`}>{it.createdAt ? formatDate(it.createdAt) : '—'}</div>
                                                      </div>

                                                      {/* metadata row */}
                                                      <div style={{
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 8,
                                                          marginTop: 8,
                                                          flexWrap: 'wrap'
                                                      }}>
                                                          {typeof total === 'number' && (
                                                            <span
                                                              style={{
                                                                  display: 'inline-flex',
                                                                  alignItems: 'center',
                                                                  gap: 6,
                                                                  padding: '2px 8px',
                                                                  borderRadius: 8,
                                                                  background: 'var(--color-heart-of-ice, #E6F2FF)',
                                                                  fontSize: tokens.chipText,
                                                                  color: 'var(--color-midnight-dreams, #001C33)',
                                                              }}
                                                            >
                                    {total.toFixed(1)} km
                                  </span>
                                                          )}
                                                          <Badge variant="outline" radius="sm" color="orange"
                                                                 styles={{label: {fontSize: tokens.chipText}}}>
                                                              {stops} stops
                                                          </Badge>
                                                          {it.corridor_radius_km && (
                                                            <Badge variant="light"
                                                                   styles={{label: {fontSize: tokens.chipText}}}>
                                                                {it.corridor_radius_km} km corridor
                                                            </Badge>
                                                          )}
                                                      </div>
                                                  </div>

                                                  {/* Delete */}
                                                  <ActionIcon
                                                    aria-label="Delete plan"
                                                    color="red"
                                                    variant="light"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActive(idx);
                                                        setConfirmDeleteOpen(true);
                                                    }}
                                                  >
                                                      <Trash2 size={14}/>
                                                  </ActionIcon>
                                              </div>
                                          </Card>
                                        );
                                    })}
                                </Stack>
                            </ScrollArea.Autosize>
                          )}
                      </Paper>

                      {/* RIGHT: Detail / Shown Route */}
                      <div
                        style={{
                            width: isMD ? '100%' : tokens.rightColWidth,
                            minWidth: 0,
                        }}
                      >
                          {!activeDoc ? (
                            <Paper withBorder radius="lg" p="xl" style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Text c="dimmed" style={{fontSize: tokens.baseText}}>
                                    Select an itinerary from the list to view details.
                                </Text>
                            </Paper>
                          ) : (
                            <Paper withBorder radius="lg" p={isXS ? 'sm' : isSM ? 'sm' : 'md'}
                                   style={{display: 'flex', flexDirection: 'column', gap: isXS ? 12 : 16}}>
                                {/* Sticky top: title + small buttons */}
                                <div
                                  style={{
                                      position: 'sticky',
                                      top: tokens.stickyTop,
                                      background: '#fff',
                                      zIndex: 1,
                                      paddingBottom: isXS ? 8 : 12,
                                      borderBottom: '1px solid var(--color-heart-of-ice, #E6F2FF)',
                                  }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: isXS ? 'column' : 'row',
                                        alignItems: isXS ? 'stretch' : 'flex-start',
                                        justifyContent: 'space-between',
                                        gap: isXS ? 8 : 12
                                    }}>
                                        <div style={{minWidth: 0}}>
                                            <div
                                              style={{
                                                  fontFamily: 'var(--font-display, Poppins)',
                                                  fontWeight: 600,
                                                  fontSize: isXS ? 14 : isSM ? 16 : 18,
                                                  color: 'var(--color-midnight-dreams, #001C33)',
                                                  whiteSpace: isXS ? 'normal' : 'nowrap',
                                                  overflow: isXS ? 'visible' : 'hidden',
                                                  textOverflow: isXS ? 'clip' : 'ellipsis',
                                                  lineHeight: 1.3,
                                              }}
                                            >
                                                {cleanPlanTitle(activeDoc.title || 'Untitled Itinerary')}
                                            </div>
                                            <div style={{
                                                marginTop: 6,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                flexWrap: 'wrap'
                                            }}>
                                                {typeof activeDoc.total_distance_km === 'number' && (
                                                  <span
                                                    style={{
                                                        padding: isXS ? '2px 6px' : '3px 8px',
                                                        background: 'var(--color-heart-of-ice, #E6F2FF)',
                                                        borderRadius: 8,
                                                        fontSize: isXS ? 11 : tokens.baseText,
                                                        color: 'var(--color-midnight-dreams, #001C33)',
                                                    }}
                                                  >
                              {km(activeDoc.total_distance_km)}
                            </span>
                                                )}
                                                <Badge size={isXS ? 'xs' : 'sm'} variant="filled" color="orange">
                                                    {(activeDoc.items || []).length} stops
                                                </Badge>
                                                {activeDoc.corridor_radius_km && (
                                                  <Badge size={isXS ? 'xs' : 'sm'} variant="light">
                                                      {activeDoc.corridor_radius_km} km corridor
                                                  </Badge>
                                                )}
                                            </div>
                                        </div>

                                        <Group gap={isXS ? 4 : 8} wrap={isXS ? 'wrap' : 'nowrap'}
                                               style={{width: isXS ? '100%' : 'auto'}}>
                                            {isXS ? (
                                              <>
                                                  <ActionIcon
                                                    size="lg"
                                                    variant="light"
                                                    onClick={() => onView(activeDoc)}
                                                    title="View Route"
                                                  >
                                                      <Eye size={18}/>
                                                  </ActionIcon>
                                                  <ActionIcon
                                                    size="lg"
                                                    variant="default"
                                                    onClick={() => onExport(activeDoc)}
                                                    title="Budget Planning"
                                                  >
                                                      <DollarSign size={18}/>
                                                  </ActionIcon>
                                                  <ActionIcon
                                                    size="lg"
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => setConfirmDeleteOpen(true)}
                                                    title="Delete"
                                                  >
                                                      <Trash2 size={18}/>
                                                  </ActionIcon>
                                              </>
                                            ) : (
                                              <>
                                                  <Button
                                                    size={tokens.buttonSize}
                                                    variant="light"
                                                    onClick={() => onView(activeDoc)}
                                                  >
                                                      View Route
                                                  </Button>
                                                  <Button
                                                    size={tokens.buttonSize}
                                                    variant="default"
                                                    onClick={() => onExport(activeDoc)}
                                                  >
                                                      Budget
                                                  </Button>
                                                  <Button
                                                    size={tokens.buttonSize}
                                                    color="red"
                                                    variant="light"
                                                    onClick={() => setConfirmDeleteOpen(true)}
                                                  >
                                                      Delete
                                                  </Button>
                                              </>
                                            )}
                                        </Group>
                                    </div>

                                    {/* quick from/to line */}
                                    <div style={{
                                        marginTop: 8,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontSize: isXS ? 10 : tokens.smallText,
                                        color: 'var(--color-welded-iron, #6E6E6E)',
                                        flexWrap: 'wrap'
                                    }}>
                                        {activeDoc.items?.[0]?.name && (
                                          <span
                                            style={{
                                                padding: isXS ? '2px 6px' : '2px 8px',
                                                borderRadius: 6,
                                                background: 'color-mix(in oklab, var(--color-desert-lilly, #FFE8D6) 70%, white)',
                                                fontSize: isXS ? 10 : tokens.smallText,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                          >
                          FROM • {isXS ? activeDoc.items[0].name.slice(0, 12) : activeDoc.items[0].name}
                        </span>
                                        )}
                                        {activeDoc.items?.length > 1 && activeDoc.items?.[activeDoc.items.length - 1]?.name && (
                                          <span
                                            style={{
                                                padding: isXS ? '2px 6px' : '2px 8px',
                                                borderRadius: 6,
                                                background: 'color-mix(in oklab, var(--color-desert-lilly, #FFE8D6) 70%, white)',
                                                fontSize: isXS ? 10 : tokens.smallText,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                            }}
                                          >
                          TO • {isXS ? activeDoc.items[activeDoc.items.length - 1].name.slice(0, 12) : activeDoc.items[activeDoc.items.length - 1].name}
                        </span>
                                        )}
                                    </div>
                                </div>

                                {/* Route list */}
                                <ScrollArea.Autosize mah={tokens.routeHeight} type="auto" offsetScrollbars>
                                    <ol style={{display: 'flex', flexDirection: 'column', gap: isXS ? 4 : 6}}>
                                        {(activeDoc.items || []).map((p, i) => {
                                            const hasCoords = typeof p.lat === 'number' && typeof p.lng === 'number';
                                            const distFromPrev =
                                              typeof p.distance_from_prev === 'number' && isFinite(p.distance_from_prev)
                                                ? `${p.distance_from_prev.toFixed(1)} km`
                                                : i === 0
                                                  ? 'Start'
                                                  : '';

                                            return (
                                              <li
                                                key={`${p.name}-${i}`}
                                                style={{
                                                    borderRadius: 10,
                                                    border: '1px solid var(--color-heart-of-ice, #E6F2FF)',
                                                    padding: isXS ? '6px 8px' : '8px 12px',
                                                    transition: 'background 120ms',
                                                }}
                                              >
                                                  <div style={{
                                                      display: 'flex',
                                                      alignItems: 'flex-start',
                                                      gap: isXS ? 8 : 12
                                                  }}>
                                                      {/* step index */}
                                                      <div
                                                        style={{
                                                            height: isXS ? 20 : 24,
                                                            width: isXS ? 20 : 24,
                                                            flex: isXS ? '0 0 20px' : '0 0 24px',
                                                            display: 'grid',
                                                            placeItems: 'center',
                                                            borderRadius: 999,
                                                            background: 'var(--color-midnight-dreams, #001C33)',
                                                            color: '#fff',
                                                            fontSize: isXS ? 10 : tokens.smallText,
                                                            fontWeight: 700,
                                                        }}
                                                      >
                                                          {i + 1}
                                                      </div>

                                                      <div style={{minWidth: 0, flex: 1}}>
                                                          {/* one-line main row */}
                                                          <div style={{
                                                              display: 'flex',
                                                              alignItems: 'center',
                                                              justifyContent: 'space-between',
                                                              gap: isXS ? 4 : 8,
                                                              flexWrap: isXS ? 'wrap' : 'nowrap'
                                                          }}>
                                                              <div
                                                                style={{
                                                                    minWidth: 0,
                                                                    whiteSpace: isXS ? 'normal' : 'nowrap',
                                                                    overflow: isXS ? 'visible' : 'hidden',
                                                                    textOverflow: isXS ? 'clip' : 'ellipsis',
                                                                    fontFamily: 'var(--font-display, Poppins)',
                                                                    fontSize: isXS ? 12 : tokens.baseText,
                                                                    color: 'var(--color-midnight-dreams, #001C33)',
                                                                    fontWeight: 500,
                                                                    lineHeight: 1.2,
                                                                }}
                                                              >
                                                                  {p.name}
                                                              </div>
                                                              <div style={{
                                                                  display: 'flex',
                                                                  alignItems: 'center',
                                                                  gap: isXS ? 4 : 8,
                                                                  flexShrink: 0,
                                                                  flexWrap: 'wrap',
                                                                  justifyContent: 'flex-end'
                                                              }}>
                                                                  {typeof p.rating === 'number' && (
                                                                    <Badge size={isXS ? 'xs' : 'xs'} variant="light"
                                                                           leftSection={<Star size={isXS ? 8 : 10}/>}>
                                                                        {p.rating.toFixed(1)}
                                                                    </Badge>
                                                                  )}
                                                                  {hasCoords && (
                                                                    <ActionIcon
                                                                      variant="subtle"
                                                                      size={isXS ? 'xs' : 'xs'}
                                                                      onClick={() => openInMaps(p.lat, p.lng, p.name)}
                                                                      title="Open in Google Maps"
                                                                    >
                                                                        <ExternalLink size={isXS ? 12 : 14}/>
                                                                    </ActionIcon>
                                                                  )}
                                                              </div>
                                                          </div>

                                                          {/* tiny meta row */}
                                                          <div
                                                            style={{
                                                                marginTop: 4,
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: isXS ? 4 : 8,
                                                                flexWrap: 'wrap',
                                                                fontSize: isXS ? 9 : tokens.smallText,
                                                                color: 'var(--color-welded-iron, #6E6E6E)',
                                                            }}
                                                          >
                                                              {distFromPrev &&
                                                                <span>{distFromPrev}{i > 0 ? ' fm prev' : ''}</span>}
                                                              {p.type && (
                                                                <span
                                                                  style={{
                                                                      display: 'inline-flex',
                                                                      alignItems: 'center',
                                                                      padding: isXS ? '1px 6px' : '2px 8px',
                                                                      borderRadius: 6,
                                                                      border: '1px solid var(--color-brave-orange, #FD661E)',
                                                                      fontSize: isXS ? 8 : tokens.chipText,
                                                                      color: 'var(--color-brave-orange, #FD661E)',
                                                                      whiteSpace: 'nowrap',
                                                                  }}
                                                                >
                                      {p.type}
                                    </span>
                                                              )}
                                                              {(p.city || p.province) && (
                                                                <span
                                                                  style={{
                                                                      display: 'inline-flex',
                                                                      alignItems: 'center',
                                                                      padding: isXS ? '1px 6px' : '2px 8px',
                                                                      borderRadius: 6,
                                                                      border: '1px solid var(--color-heart-of-ice, #E6F2FF)',
                                                                      fontSize: isXS ? 8 : tokens.chipText,
                                                                      color: 'var(--color-midnight-dreams, #001C33)',
                                                                      whiteSpace: 'nowrap',
                                                                  }}
                                                                >
                                      {p.city ? `${p.city}` : ''}
                                                                    {p.city && p.province ? ', ' : ''}
                                                                    {p.province || ''}
                                    </span>
                                                              )}
                                                          </div>
                                                      </div>
                                                  </div>
                                              </li>
                                            );
                                        })}
                                    </ol>
                                </ScrollArea.Autosize>
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
                  This will permanently remove "{cleanPlanTitle(activeDoc?.title || 'Untitled Itinerary')}".
              </Text>
              <Group justify="flex-end">
                  <Button size="xs" variant="default" onClick={() => setConfirmDeleteOpen(false)}>
                      Cancel
                  </Button>
                  <Button size="xs" color="red" onClick={onConfirmDelete} leftSection={<Trash2 size={14}/>}>
                      Delete
                  </Button>
              </Group>
          </Modal>
      </>
    );
}