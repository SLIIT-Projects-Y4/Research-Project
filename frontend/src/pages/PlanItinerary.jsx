// src/pages/PlanItinerary.jsx
import React, {useEffect, useMemo, useState} from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import {
    Badge, Button, Group, Paper, Text, Title, Timeline, Divider,
    Drawer, Tabs, Loader, Card, Stack, Tooltip, Container, rem,
    ActionIcon, Flex, Box, ScrollArea
} from '@mantine/core';
import {
    MapPin, Flag, Route as RouteIcon, Star, Info, Compass,
    ListChecks, ArrowLeftRight as ReplaceIcon, Lock, Sparkles,
    Download, Save, ArrowLeft, FolderOpen, Zap, Navigation,
    Clock, Award, Target, Eye, ArrowRightFromLine
} from 'lucide-react';
import {toast} from 'react-toastify';
import {saveItinerary} from '../api/itineraries';
import {optionsForLocation} from '../api/itinerary';
import {optimizePlan} from '../api/plan';

// ---------- utils (keeping all existing utility functions) ----------
const km = (n) => (typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—');

const toNum = (v) => {
    const n = typeof v === 'string' ? parseFloat(v) : v;
    return typeof n === 'number' && isFinite(n) ? n : null;
};

const getCoords = (obj) => {
    if (!obj) return null;
    const latCands = [obj.lat, obj.latitude, obj.Latitude, obj.LAT];
    const lngCands = [obj.lng, obj.lon, obj.long, obj.longitude, obj.Longitude, obj.LNG];

    let lat = null, lng = null;

    for (const c of latCands) {
        const n = toNum(c);
        if (n !== null) {
            lat = n;
            break;
        }
    }
    for (const c of lngCands) {
        const n = toNum(c);
        if (n !== null) {
            lng = n;
            break;
        }
    }
    return (lat !== null && lng !== null) ? {lat, lng} : null;
};

function haversineKm(a, b) {
    if (!a || !b) return null;
    const {lat: lat1, lng: lon1} = a;
    const {lat: lat2, lng: lon2} = b;
    if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || !isFinite(v))) return null;
    const toRad = (d) => (d * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    return R * c;
}

function recomputeDistances(itin) {
    const next = itin.map((p) => ({...p}));
    let total = 0;
    for (let i = 0; i < next.length; i++) {
        if (i === 0) next[i].distance_from_prev = 0;
        else {
            const d = haversineKm(getCoords(next[i - 1]), getCoords(next[i]));
            next[i].distance_from_prev = typeof d === 'number' ? d : next[i].distance_from_prev ?? null;
            if (typeof d === 'number') total += d;
        }
    }
    return {next, total};
}

function itinerarySignature(itin) {
    return JSON.stringify(
      itin.map((x) => {
          const c = getCoords(x);
          return {
              n: x.name || '',
              x: c ? +c.lat.toFixed(6) : null,
              y: c ? +c.lng.toFixed(6) : null,
          };
      })
    );
}

// localStorage utility functions (keeping all existing)
const getSavedItineraries = () => {
    try {
        const saved = localStorage.getItem('savedItineraries');
        return saved ? JSON.parse(saved) : {};
    } catch {
        return {};
    }
};

const getLocationIdsByTitle = (title) => {
    const savedItineraries = getSavedItineraries();
    return savedItineraries[title]?.locationIds || [];
};

const getAllSavedTitles = () => {
    const savedItineraries = getSavedItineraries();
    return Object.keys(savedItineraries);
};

const getItineraryDetails = (title) => {
    const savedItineraries = getSavedItineraries();
    return savedItineraries[title] || null;
};

// ---------- Enhanced Timeline Item Component ----------
function TimelineStop({item, idx, totalStops, onExplore, onOpenInMaps, isOptimizing}) {
    const c = getCoords(item);
    const distance = item.distance_from_prev;
    const isStart = idx === 0;
    const isEnd = idx === totalStops - 1;
    const isFixed = isStart || isEnd;

    const getBulletColor = () => {
        if (isStart) return 'var(--color-lemon-dream)';
        if (isEnd) return 'var(--color-rust-red)';
        return 'var(--color-brave-orange)';
    };

    const bullet = (
      <Paper
        radius="xl"
        p="xs"
        style={{
            backgroundColor: getBulletColor(),
            border: '3px solid white',
            boxShadow: '0 2px 8px rgba(0, 28, 51, 0.15)'
        }}
      >
          {isStart ? <Navigation size={18} color="white"/> :
            isEnd ? <Target size={18} color="white"/> :
              <MapPin size={18} color="white"/>}
      </Paper>
    );

    return (
      <Timeline.Item bullet={bullet}>
          <Card
            radius="xl"
            p="md"
            withBorder
            className="hover:shadow-lg transition-all duration-300"
            style={{
                backgroundColor: 'white',
                borderColor: isFixed ? 'var(--color-heart-of-ice)' : 'var(--color-lynx-white)',
                borderWidth: '2px',
                marginLeft: rem(-8)
            }}
          >
              {/* Header */}
              <Group justify="space-between" align="flex-start" mb="md">
                  <div className="flex-1">
                      <Group gap="sm" mb="xs">
                          <button
                            className="text-left font-display font-bold text-xl hover:underline transition-colors"
                            onClick={() => onExplore(idx, item)}
                            style={{color: 'var(--color-midnight-dreams)'}}
                            title="Explore options for this stop"
                          >
                              {idx + 1}. {item.name}
                          </button>

                          {isFixed && (
                            <Badge
                              leftSection={<Lock size={14}/>}
                              variant="filled"
                              color="gray"
                              size="lg"
                            >
                                Fixed
                            </Badge>
                          )}
                      </Group>

                      {/* Location info */}
                      <Group gap="xs" mb="sm" wrap="wrap">
                          {item.type && (
                            <Badge
                              variant="light"
                              color="blue"
                              size="md"
                            >
                                {(item.type || '').toUpperCase()}
                            </Badge>
                          )}

                          {(item.city || item.province) && (
                            <Badge
                              variant="outline"
                              color="gray"
                              size="md"
                              leftSection={<MapPin size={12}/>}
                            >
                                {item.city ? `${item.city}` : ''}{item.city && item.province ? ', ' : ''}{item.province || ''}
                            </Badge>
                          )}

                          {item.original_city_label && (
                            <Badge
                              variant="outline"
                              color="orange"
                              size="md"
                              leftSection={<Info size={12}/>}
                            >
                                from city: {item.original_city_label}
                            </Badge>
                          )}
                      </Group>

                      {/* Metrics */}
                      <Group gap="md">
                          {toNum(item.rating) !== null && (
                            <Group gap="xs">
                                <Paper p="xs" radius="md" style={{backgroundColor: 'var(--color-malibu-sun)'}}>
                                    <Star size={16} style={{color: 'var(--color-lemon-dream)'}}/>
                                </Paper>
                                <div>
                                    <Text size="sm" fw={600} style={{color: 'var(--color-midnight-dreams)'}}>
                                        {toNum(item.rating).toFixed(1)}
                                    </Text>
                                    <Text size="xs" c="dimmed">Rating</Text>
                                </div>
                            </Group>
                          )}

                          {distance != null && idx > 0 && (
                            <Group gap="xs">
                                <Paper p="xs" radius="md" style={{backgroundColor: 'var(--color-heart-of-ice)'}}>
                                    <RouteIcon size={16} style={{color: 'var(--color-ocean-depths)'}}/>
                                </Paper>
                                <div>
                                    <Text size="sm" fw={600} style={{color: 'var(--color-midnight-dreams)'}}>
                                        {km(distance)}
                                    </Text>
                                    <Text size="xs" c="dimmed">From previous</Text>
                                </div>
                            </Group>
                          )}
                      </Group>
                  </div>

                  {/* Actions */}
                  <Group gap="xs">

                      <Button
                        variant="light"
                        color="orange"
                        leftSection={<Eye size={16}/>}
                        onClick={() => onExplore(idx, item)}
                        radius="xl"
                        size="md"
                      >
                          Explore
                      </Button>
                  </Group>
              </Group>
          </Card>
      </Timeline.Item>
    );
}

// ---------- Enhanced Drawer Content ----------
function OptionsDrawer({opened, onClose, title, loading, data, activeIndex, plan, onReplace}) {
    const ListBlock = ({items, category}) => (
      <Stack gap="md">
          {(!items || items.length === 0) ? (
            <Paper
              p="xl"
              radius="lg"
              ta="center"
              style={{backgroundColor: 'var(--color-lynx-white)'}}
            >
                <Text c="dimmed" size="sm" className="font-body">
                    No {category.toLowerCase()} options found
                </Text>
            </Paper>
          ) : items.map((x, i) => {
              const xC = getCoords(x);
              const dBase = typeof x.distance_from_base_km === 'number'
                ? x.distance_from_base_km
                : null;

              const isEndpoint = activeIndex === 0 || activeIndex === (plan?.itinerary?.length - 1);
              const hasCoords = !!xC;
              const disabledReason = isEndpoint ? 'Start/End cannot be replaced' : (!hasCoords ? 'No coordinates' : null);

              return (
                <Card
                  key={`${x.location || x.name}-${i}`}
                  withBorder
                  radius="lg"
                  p="lg"
                  className="hover:shadow-md transition-all duration-200"
                  style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--color-heart-of-ice)'
                  }}
                >
                    <Group justify="space-between" align="flex-start">
                        <div className="flex-1 min-w-0">
                            <Text
                              fw={600}
                              size="lg"
                              className="font-display truncate mb-2"
                              style={{color: 'var(--color-midnight-dreams)'}}
                            >
                                {x.location || x.name}
                            </Text>

                            <Group gap="xs" mb="md" wrap="wrap">
                                {x.type && (
                                  <Badge variant="light" color="blue" size="sm">
                                      {x.type}
                                  </Badge>
                                )}

                                {(x.province || x.Located_Province) && (
                                  <Badge
                                    variant="outline"
                                    color="gray"
                                    size="sm"
                                    leftSection={<MapPin size={12}/>}
                                  >
                                      {x.province || x.Located_Province}
                                  </Badge>
                                )}

                                {toNum(x.avg_rating) !== null && (
                                  <Badge
                                    variant="light"
                                    color="yellow"
                                    size="sm"
                                    leftSection={<Star size={12}/>}
                                  >
                                      {toNum(x.avg_rating).toFixed(1)}
                                  </Badge>
                                )}

                                {dBase != null && (
                                  <Badge
                                    variant="light"
                                    color="cyan"
                                    size="sm"
                                    leftSection={<Compass size={12}/>}
                                  >
                                      {km(dBase)}
                                  </Badge>
                                )}
                            </Group>

                            <Group gap="xs">
                                {hasCoords && (
                                  <Button
                                    size="xs"
                                    variant="light"
                                    color="blue"
                                    leftSection={<Navigation size={14}/>}
                                    onClick={() => {
                                        const url = `https://www.google.com/maps?q=${xC.lat},${xC.lng}(${encodeURIComponent(x.location || x.name || '')})`;
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    }}
                                  >
                                      View Map
                                  </Button>
                                )}

                                {disabledReason ? (
                                  <Tooltip label={disabledReason}>
                                      <Button
                                        size="xs"
                                        variant="light"
                                        color="gray"
                                        disabled
                                        leftSection={<Lock size={14}/>}
                                      >
                                          Replace
                                      </Button>
                                  </Tooltip>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="filled"
                                    color="orange"
                                    leftSection={<ReplaceIcon size={14}/>}
                                    onClick={() => onReplace(activeIndex, x)}
                                  >
                                      Replace Stop
                                  </Button>
                                )}
                            </Group>
                        </div>
                    </Group>
                </Card>
              );
          })}
      </Stack>
    );

    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        position="right"
        size="xl"
        radius="lg"
        styles={{
            header: {
                backgroundColor: 'var(--color-heart-of-ice)',
                borderBottom: '2px solid var(--color-lynx-white)'
            },
            body: {
                backgroundColor: 'var(--color-lynx-white)',
                padding: rem(24)
            }
        }}
        title={
            <Group gap="md">
                <Paper p="sm" radius="lg" style={{backgroundColor: 'var(--color-brave-orange)'}}>
                    <ListChecks size={20} color="white"/>
                </Paper>
                <div>
                    <Text fw={700} size="xl" className="font-display" style={{color: 'var(--color-midnight-dreams)'}}>
                        Explore Options
                    </Text>
                    <Text size="sm" c="dimmed" className="font-body">
                        {title || 'Alternative destinations'}
                    </Text>
                </div>
            </Group>
        }
      >
          {loading ? (
            <div className="flex items-center justify-center py-20">
                <Stack align="center" gap="md">
                    <Loader size="xl" color="orange"/>
                    <Text c="dimmed" className="font-body">Finding the best alternatives...</Text>
                </Stack>
            </div>
          ) : !data ? (
            <Paper p="xl" radius="lg" ta="center" style={{backgroundColor: 'var(--color-heart-of-ice)'}}>
                <Text c="dimmed" className="font-body">No data available.</Text>
            </Paper>
          ) : (
            <Tabs defaultValue="hybrid" variant="pills" radius="xl">
                <Tabs.List mb="xl" style={{backgroundColor: 'white', padding: rem(8), borderRadius: rem(16)}}>
                    <Tabs.Tab value="nearby" leftSection={<Compass size={16}/>}>
                        Nearby
                    </Tabs.Tab>
                    <Tabs.Tab value="smart_alternatives" leftSection={<Award size={16}/>}>
                        Smart Alternatives
                    </Tabs.Tab>
                    <Tabs.Tab value="top_rated" leftSection={<Target size={16}/>}>
                        Top Rated
                    </Tabs.Tab>
                    <Tabs.Tab value="similar_activities" leftSection={<Star size={16}/>}>
                        Similar Activities
                    </Tabs.Tab>
                </Tabs.List>

                <ScrollArea h={600}>
                    <Tabs.Panel value="nearby">
                        <ListBlock items={data.nearby} category="Near By"/>
                    </Tabs.Panel>
                    <Tabs.Panel value="smart_alternatives">
                        <ListBlock items={data.smart_alternatives} category="Smart Alternatives"/>
                    </Tabs.Panel>
                    <Tabs.Panel value="top_rated">
                        <ListBlock items={data.top_rated} category="Top-rated"/>
                    </Tabs.Panel>
                    <Tabs.Panel value="similar_activities">
                        <ListBlock items={data.similar_activities} category="Similar activities"/>
                    </Tabs.Panel>
                </ScrollArea>
            </Tabs>
          )}
      </Drawer>
    );
}

// ---------- Main Component ----------
export default function PlanItinerary() {
    const navigate = useNavigate();
    const location = useLocation();

    // All existing state (keeping exactly the same)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerLoading, setDrawerLoading] = useState(false);
    const [drawerTitle, setDrawerTitle] = useState('');
    const [drawerData, setDrawerData] = useState(null);
    const [activeIndex, setActiveIndex] = useState(null);
    const [baseStop, setBaseStop] = useState(null);

    const payload = useMemo(() => {
        if (location.state && location.state.status === 'ok') return location.state;
        try {
            const raw = sessionStorage.getItem('lastPlan');
            const parsed = raw ? JSON.parse(raw) : null;
            return parsed && parsed.status === 'ok' ? parsed : null;
        } catch {
            return null;
        }
    }, [location.state]);

    const [plan, setPlan] = useState(payload || null);
    const [saving, setSaving] = useState(false);
    const [optimizing, setOptimizing] = useState(false);

    const [baselineSig, setBaselineSig] = useState(() =>
      payload?.itinerary ? itinerarySignature(payload.itinerary) : null
    );

    const needsOptimize = useMemo(() => {
        if (!plan?.itinerary?.length) return false;
        return itinerarySignature(plan.itinerary) !== baselineSig;
    }, [plan?.itinerary, baselineSig]);

    useEffect(() => {
        setPlan(payload || null);
        setBaselineSig(payload?.itinerary ? itinerarySignature(payload.itinerary) : null);
    }, [payload]);

    // All existing functions (keeping exactly the same logic)
    const openInMaps = (lat, lng, name) => {
        const c = getCoords({lat, lng});
        if (!c) {
            toast.info('No coordinates available');
            return;
        }
        const url = `https://www.google.com/maps?q=${c.lat},${c.lng}(${encodeURIComponent(name || '')})`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const defaultTitle = (() => {
        const s = plan?.start?.name || plan?.itinerary?.[0]?.name || 'Start';
        const e = plan?.end?.name || plan?.itinerary?.[plan?.itinerary?.length - 1]?.name || 'End';
        const r = plan?.corridor_radius_km ? ` (${plan.corridor_radius_km}km corridor)` : '';
        return `${s} → ${e}${r}`;
    })();

    const onSave = async () => {
        try {
            setSaving(true);
            const title = defaultTitle;
            const res = await saveItinerary(plan, title);

            if (res?.status === 'created') {
                const locationIds = plan.itinerary
                  .filter(item => item.location_id !== null && item.location_id !== undefined)
                  .map(item => item.location_id);

                let savedItineraries = {};
                try {
                    const existing = localStorage.getItem('savedItineraries');
                    savedItineraries = existing ? JSON.parse(existing) : {};
                } catch (storageError) {
                    console.warn('Failed to read existing itineraries from localStorage:', storageError);
                    savedItineraries = {};
                }

                savedItineraries[title] = {
                    locationIds: locationIds,
                    savedAt: new Date().toISOString(),
                    totalDistance: plan.total_distance_km,
                    attractionsCount: plan.attractions_count
                };

                try {
                    localStorage.setItem('savedItineraries', JSON.stringify(savedItineraries));
                    console.log(`Saved itinerary "${title}" with location IDs:`, locationIds);
                } catch (storageError) {
                    console.warn('Failed to save itinerary to localStorage:', storageError);
                }

                toast.success('Itinerary saved successfully!');
            } else {
                toast.error('Unexpected response while saving');
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.message || 'Failed to save itinerary');
        } finally {
            setSaving(false);
        }
    };

    const fetchOptionsFor = async (idx, loc) => {
        try {
            setActiveIndex(idx);
            setBaseStop(loc);
            setDrawerTitle(loc.name);
            setDrawerData(null);
            setDrawerLoading(true);
            setDrawerOpen(true);

            const body = {
                location_name: loc.name,
                included_provinces: plan?.province_corridor && plan.province_corridor.length ? plan.province_corridor : undefined,
                radius_km: 50,
                top_n: 8,
                start_lat: plan?.start?.lat ?? plan?.itinerary?.[0]?.lat,
                start_lng: plan?.start?.lng ?? plan?.itinerary?.[0]?.lng,
                end_lat: plan?.end?.lat ?? plan?.itinerary?.[plan?.itinerary?.length - 1]?.lat,
                end_lng: plan?.end?.lng ?? plan?.itinerary?.[plan?.itinerary?.length - 1]?.lng,
                corridor_radius_km: plan?.corridor_radius_km ?? undefined,
            };

            const res = await optionsForLocation(body);
            if (res?.data.status !== 'ok') {
                toast.error('Unexpected itinerary options response');
                return;
            }

            const presentNames = new Set(plan.itinerary.map(s => String(s.name || '').trim().toLowerCase()));
            const filterList = (arr) =>
              (Array.isArray(arr) ? arr : []).filter(x => {
                  const nm = String((x.location || x.name || '')).trim().toLowerCase();
                  if (!nm || presentNames.has(nm)) return false;
                  const xc = getCoords(x);
                  if (xc) {
                      for (const s of plan.itinerary) {
                          const sc = getCoords(s);
                          if (sc) {
                              const d = haversineKm(xc, sc);
                              if (d != null && d < 0.05) return false;
                          }
                      }
                  }
                  return true;
              });

            setDrawerData({
                ...res,
                nearby: filterList(res.data.nearby),
                smart_alternatives: filterList(res.data.smart_alternatives),
                top_rated: filterList(res.data.top_rated),
                similar_activities: filterList(res.data.similar_activities),
            });
            console.log(drawerData);
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.message || 'Failed to load location options');
        } finally {
            setDrawerLoading(false);
        }
    };

    const replaceStopAt = (index, candidate) => {
        if (!plan?.itinerary?.length) return;

        if (index === 0 || index === plan.itinerary.length - 1) {
            toast.info('Start and End cannot be replaced');
            return;
        }

        const c = getCoords(candidate);
        if (!c) {
            toast.error('This suggestion has no coordinates. Please pick one that includes lat/lng.');
            return;
        }

        const newStop = {
            name: candidate.location || candidate.name || 'Unknown',
            lat: c.lat,
            lng: c.lng,
            type: candidate.type || null,
            province: candidate.province || candidate.Located_Province || null,
            city: candidate.city || candidate.Located_City || null,
            rating: toNum(candidate.avg_rating) ?? toNum(candidate.rating) ?? null,
            is_city: false,
            // ADDED: Preserve location_id from candidate if available
            location_id: candidate.location_id || candidate.id || null,
        };

        const edited = [...plan.itinerary];
        edited[index] = {...edited[index], ...newStop};

        const {next, total} = recomputeDistances(edited);
        const updated = {
            ...plan,
            itinerary: next,
            total_distance_km: Number.isFinite(total) ? total : plan.total_distance_km,
        };

        setPlan(updated);
        try {
            sessionStorage.setItem('lastPlan', JSON.stringify(updated));
        } catch {
        }
        toast.success('Stop replaced successfully!');
        setDrawerOpen(false);
    };

    const onOptimize = async () => {
        try {
            setOptimizing(true);

            const itin = plan.itinerary || [];
            if (itin.length < 2) return;

            const payloadItin = itin.map((s, i, arr) => {
                const c = getCoords(s);
                return {
                    name: s.name,
                    lat: c?.lat,
                    lng: c?.lng,
                    type: (i === 0 || i === arr.length - 1) ? (s.type || 'City') : s.type,
                    province: s.province,
                    city: s.city,
                    rating: s.rating,
                    is_city: (i === 0 || i === arr.length - 1) ? true : !!s.is_city,
                    distance_from_prev: s.distance_from_prev,
                    // ADDED: Include location_id in payload
                    location_id: s.location_id
                };
            });

            const resp = await optimizePlan({
                itinerary: payloadItin,
                corridor_radius_km: plan.corridor_radius_km ?? undefined,
            });

            if (resp.status === 'ok' && Array.isArray(resp.itinerary) && resp.itinerary.length === itin.length) {
                let newItin = resp.itinerary;
                let newTotal = resp.total_distance_km;

                // ADDED: Preserve location_ids from original itinerary
                newItin = newItin.map((item, index) => ({
                    ...item,
                    location_id: item.location_id || itin[index]?.location_id || null
                }));

                if (!Array.isArray(newItin) || typeof newTotal !== 'number') {
                    const r = recomputeDistances(resp.itinerary || itin);
                    newItin = r.next;
                    newTotal = r.total;
                }
                const nextPlan = {
                    ...plan,
                    itinerary: newItin,
                    total_distance_km: newTotal,
                    start: {
                        name: newItin[0]?.name,
                        province: newItin[0]?.province,
                        lat: newItin[0]?.lat,
                        lng: newItin[0]?.lng,
                    },
                    end: {
                        name: newItin[newItin.length - 1]?.name,
                        province: newItin[newItin.length - 1]?.province,
                        lat: newItin[newItin.length - 1]?.lat,
                        lng: newItin[newItin.length - 1]?.lng,
                    }
                };
                setPlan(nextPlan);
                setBaselineSig(itinerarySignature(nextPlan.itinerary));
                try {
                    sessionStorage.setItem('lastPlan', JSON.stringify(nextPlan));
                } catch {
                }
                toast.success('Route optimized successfully!');
            } else {
                const errMsg = resp?.data?.detail?.error || resp?.error || 'Optimize WW failed';
                toast.error(errMsg);
            }
        } catch (err) {
            toast.error(err?.response?.data?.error || err?.message || 'Optimize failed');
        } finally {
            setOptimizing(false);
        }
    };

    if (!plan) {
        return (
          <div className="min-h-screen">
              <Container size="md" py={rem(80)}>
                  <Stack align="center" gap="md">
                      <Paper
                        p="xl"
                        radius="xl"
                        ta="center"
                        withBorder
                        style={{
                            backgroundColor: 'white',
                            borderColor: 'var(--color-heart-of-ice)',
                            borderWidth: '2px'
                        }}
                      >
                          <RouteIcon size={64} style={{color: 'var(--color-welded-iron)', marginBottom: rem(16)}}/>
                          <Title order={2} className="font-display mb-4"
                                 style={{color: 'var(--color-midnight-dreams)'}}>
                              No Itinerary Found
                          </Title>
                          <Text c="dimmed" className="font-body mb-6">
                              No plan loaded. Please generate a plan first to view your itinerary.
                          </Text>
                          <Button
                            size="lg"
                            radius="xl"
                            color="orange"
                            leftSection={<ArrowLeft size={20}/>}
                            onClick={() => navigate('/plan/create')}
                          >
                              Go to Plan Builder
                          </Button>
                      </Paper>
                  </Stack>
              </Container>
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
    } = plan;

    const startProvince = start?.province || itinerary[0]?.province || 'Unknown Province';
    const endProvince = end?.province || itinerary[itinerary.length - 1]?.province || 'Unknown Province';

    return (
      <div className="min-h-screen mt-8">
          <Container size="lg" py={rem(80)}>
              {/* Header */}
              <div className="mb-12">
                  <Group justify="space-between" align="flex-start" mb="lg">
                      <div>
                          <h1
                            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
                              Plan Itinerary
                          </h1>
                      </div>

                      <Group gap="md">
                          {needsOptimize && (
                            <Button
                              size="md"
                              variant='gradient'
                              radius="sm"
                              loading={optimizing}
                              onClick={onOptimize}
                              leftSection={<Sparkles size={18}/>}
                              color="var(--color-heart-of-ice)"
                            >
                                Optimize Route
                            </Button>
                          )}

                          <Group gap="xs">

                              <Button
                                size={'md'}
                                variant="light"
                                color="var(--color-lemon-dream)"
                                leftSection={<FolderOpen size={16}/>}
                                onClick={() => navigate('/plan/saved')}
                                radius="sm"
                              >
                                  View Saved
                              </Button>

                              <Button
                                size="md"
                                radius="sm"
                                loading={saving}
                                onClick={onSave}
                                leftSection={<Save size={18}/>}
                                color="var(--color-brave-orange)"
                                variant="filled"
                              >
                                  Save Plan
                              </Button>
                          </Group>
                      </Group>
                  </Group>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {/* Start Location */}
                  <Card
                    radius="xl"
                    p="xl"
                    withBorder
                    style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--color-heart-of-ice)',
                        borderWidth: '2px'
                    }}
                  >
                      <Group gap="md" mb="sm">
                          <Paper
                            p="md"
                            radius="lg"
                            style={{backgroundColor: 'var(--color-malibu-sun)'}}
                          >
                              <Navigation size={24} style={{color: 'var(--color-lemon-dream)'}}/>
                          </Paper>
                          <div>
                              <Text size="sm" c="dimmed" className="font-body">Start Location</Text>
                              <Text fw={700} size="lg" className="font-display"
                                    style={{color: 'var(--color-midnight-dreams)'}}>
                                  {start?.name || itinerary[0]?.name || '—'}
                              </Text>
                          </div>
                      </Group>
                      <Text size="sm" c="dimmed" mb="md" className="font-display font-medium">
                          Province: {startProvince}
                      </Text>
                  </Card>

                  {/* End Location */}
                  <Card
                    radius="xl"
                    p="xl"
                    withBorder
                    style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--color-heart-of-ice)',
                        borderWidth: '2px'
                    }}
                  >
                      <Group gap="md" mb="md">
                          <Paper
                            p="md"
                            radius="lg"
                            style={{backgroundColor: 'var(--color-desert-lilly)'}}
                          >
                              <Flag size={24} style={{color: 'var(--color-rust-red)'}}/>
                          </Paper>
                          <div>
                              <Text size="sm" c="dimmed" className="font-body">End Location</Text>
                              <Text fw={700} size="lg" className="font-display"
                                    style={{color: 'var(--color-midnight-dreams)'}}>
                                  {end?.name || itinerary[itinerary.length - 1]?.name || '—'}
                              </Text>
                          </div>
                      </Group>
                      <Text size="sm" c="dimmed" mb="md" className="font-display font-medium">
                          Province: {endProvince}
                      </Text>
                  </Card>

                  {/* Trip Summary */}
                  <Card
                    radius="xl"
                    p="xl"
                    withBorder
                    style={{
                        backgroundColor: 'white',
                        borderColor: 'var(--color-heart-of-ice)',
                        borderWidth: '2px'
                    }}
                  >
                      <Group gap="md" mb="md">
                          <Paper
                            p="md"
                            radius="lg"
                            style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                          >
                              <Clock size={24} style={{color: 'var(--color-ocean-depths)'}}/>
                          </Paper>
                          <div>
                              <Text size="sm" c="dimmed" className="font-body">Trip Summary</Text>
                              <Text fw={700} size="lg" className="font-display"
                                    style={{color: 'var(--color-midnight-dreams)'}}>
                                  {km(total_distance_km)}
                              </Text>
                          </div>
                      </Group>
                      <Text size="sm" c="dimmed" mb="md" className="font-display font-medium">
                          Radius: {corridor_radius_km} km corridor
                      </Text>
                  </Card>
              </div>

              {/* Province Corridor */}
              {province_corridor?.length > 0 && (
                <Card
                  radius="xl"
                  p="xl"
                  withBorder
                  mb="xl"
                  style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--color-heart-of-ice)',
                      borderWidth: '2px'
                  }}
                >
                    <Group gap="md" mb="md">
                        <Paper
                          p="sm"
                          radius="lg"
                          style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                        >
                            <RouteIcon size={20} style={{color: 'var(--color-ocean-depths)'}}/>
                        </Paper>
                        <Text fw={600} className="font-display" style={{color: 'var(--color-midnight-dreams)'}}>
                            Province Corridor
                        </Text>
                    </Group>
                    <Group gap="xs">
                        {province_corridor.map((p) => (
                          <Badge key={p} variant="outline" color="blue" size="md">
                              {p}
                          </Badge>
                        ))}
                    </Group>
                </Card>
              )}

              {/* Timeline */}
              <Card
                radius="xl"
                p="xl"
                withBorder
                style={{
                    backgroundColor: 'white',
                    borderColor: 'var(--color-heart-of-ice)',
                    borderWidth: '2px'
                }}
              >
                  <Group gap="md" mb="xl">
                      <Paper
                        p="sm"
                        radius="lg"
                        style={{backgroundColor: 'var(--color-brave-orange)'}}
                      >
                          <RouteIcon size={24} color="white"/>
                      </Paper>
                      <div>
                          <Title order={3} className="font-display" style={{color: 'var(--color-midnight-dreams)'}}>
                              Your Journey Route
                          </Title>
                          <Text size="sm" c="dimmed" className="font-body">
                              Click on any stop to explore alternative destinations
                          </Text>
                      </div>
                  </Group>

                  <Timeline
                    bulletSize={40}
                    lineWidth={3}
                    active={itinerary.length}
                    color="orange"
                  >
                      {itinerary.map((item, idx) => (
                        <TimelineStop
                          key={`${item.name}-${idx}`}
                          item={item}
                          idx={idx}
                          totalStops={itinerary.length}
                          onExplore={fetchOptionsFor}
                          onOpenInMaps={openInMaps}
                          isOptimizing={optimizing}
                        />
                      ))}
                  </Timeline>
              </Card>
          </Container>

          {/* Options Drawer */}
          <OptionsDrawer
            opened={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            title={drawerTitle}
            loading={drawerLoading}
            data={drawerData}
            activeIndex={activeIndex}
            plan={plan}
            onReplace={replaceStopAt}
          />
      </div>
    );
}

// Export utility functions
export {getSavedItineraries, getLocationIdsByTitle, getAllSavedTitles, getItineraryDetails};