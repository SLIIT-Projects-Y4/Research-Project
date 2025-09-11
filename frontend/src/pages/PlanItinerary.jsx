// src/pages/PlanItinerary.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge, Button, Group, Paper, Text, Title, Timeline, Divider,
  Drawer, Tabs, Loader, Card, Stack, Tooltip
} from '@mantine/core';
import {
  MapPin, Flag, Route as RouteIcon, Star, Info, Compass,
  ListChecks, ArrowLeftRight as ReplaceIcon, Lock, Sparkles
} from 'lucide-react';
import { toast } from 'react-toastify';
import { saveItinerary } from '../api/itineraries';
import { optionsForLocation } from '../api/itinerary';
import { optimizePlan } from '../api/plan';

// ---------- utils ----------
const km = (n) => (typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—');

const toNum = (v) => {
  const n = typeof v === 'string' ? parseFloat(v) : v;
  return typeof n === 'number' && isFinite(n) ? n : null;
};

// Accept many possible coord key names coming from ML
const getCoords = (obj) => {
  if (!obj) return null;
  const latCands = [obj.lat, obj.latitude, obj.Latitude, obj.LAT];
  const lngCands = [obj.lng, obj.lon, obj.long, obj.longitude, obj.Longitude, obj.LNG];

  let lat = null, lng = null;

  for (const c of latCands) {
    const n = toNum(c);
    if (n !== null) { lat = n; break; }
  }
  for (const c of lngCands) {
    const n = toNum(c);
    if (n !== null) { lng = n; break; }
  }
  return (lat !== null && lng !== null) ? { lat, lng } : null;
};

function haversineKm(a, b) {
  if (!a || !b) return null;
  const { lat: lat1, lng: lon1 } = a;
  const { lat: lat2, lng: lon2 } = b;
  if ([lat1, lon1, lat2, lon2].some(v => typeof v !== 'number' || !isFinite(v))) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2)**2;
  const c = 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  return R * c;
}

function recomputeDistances(itin) {
  const next = itin.map((p) => ({ ...p }));
  let total = 0;
  for (let i = 0; i < next.length; i++) {
    if (i === 0) next[i].distance_from_prev = 0;
    else {
      const d = haversineKm(getCoords(next[i - 1]), getCoords(next[i]));
      next[i].distance_from_prev = typeof d === 'number' ? d : next[i].distance_from_prev ?? null;
      if (typeof d === 'number') total += d;
    }
  }
  return { next, total };
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

// ---------- component ----------
export default function PlanItinerary() {
  const navigate = useNavigate();
  const location = useLocation();

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerTitle, setDrawerTitle] = useState('');
  const [drawerData, setDrawerData] = useState(null);
  const [activeIndex, setActiveIndex] = useState(null);
  const [baseStop, setBaseStop] = useState(null);

  // Initial payload (nav state or session)
  const payload = useMemo(() => {
    if (location.state && location.state.status === 'ok') return location.state;
    try {
      const raw = sessionStorage.getItem('lastPlan');
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && parsed.status === 'ok' ? parsed : null;
    } catch { return null; }
  }, [location.state]);

  // Working plan
  const [plan, setPlan] = useState(payload || null);
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState(false);

  // Show "Optimize route" only when changed
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

  if (!plan) {
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
  } = plan;

  const startProvince = start?.province || itinerary[0]?.province || 'Unknown Province';
  const endProvince = end?.province || itinerary[itinerary.length - 1]?.province || 'Unknown Province';

  const openInMaps = (lat, lng, name) => {
    const c = getCoords({ lat, lng });
    if (!c) { toast.info('No coordinates available'); return; }
    const url = `https://www.google.com/maps?q=${c.lat},${c.lng}(${encodeURIComponent(name || '')})`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const defaultTitle = (() => {
    const s = start?.name || itinerary[0]?.name || 'Start';
    const e = end?.name || itinerary[itinerary.length - 1]?.name || 'End';
    const r = corridor_radius_km ? ` (${corridor_radius_km}km corridor)` : '';
    return `${s} → ${e}${r}`;
  })();

  const onSave = async () => {
    try {
      setSaving(true);
      const title = defaultTitle;
      const res = await saveItinerary(plan, title);
      if (res?.status === 'created') toast.success('Itinerary saved');
      else toast.error('Unexpected response while saving');
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to save itinerary');
    } finally { setSaving(false); }
  };

  // -------- fetch per-stop options (from ML) --------
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
        included_provinces: province_corridor && province_corridor.length ? province_corridor : undefined,
        radius_km: 50,
        top_n: 8,
        start_lat: start?.lat ?? itinerary[0]?.lat,
        start_lng: start?.lng ?? itinerary[0]?.lng,
        end_lat: end?.lat ?? itinerary[itinerary.length - 1]?.lat,
        end_lng: end?.lng ?? itinerary[itinerary.length - 1]?.lng,
        corridor_radius_km: corridor_radius_km ?? undefined,
      };

      const res = await optionsForLocation(body);
      if (res?.status !== 'ok') {
        toast.error('Unexpected itinerary options response');
        return;
      }

      // Filter out places already in itinerary (by name and ~50m proximity)
      const presentNames = new Set(itinerary.map(s => String(s.name||'').trim().toLowerCase()));
      const filterList = (arr) =>
        (Array.isArray(arr) ? arr : []).filter(x => {
          const nm = String((x.location || x.name || '')).trim().toLowerCase();
          if (!nm || presentNames.has(nm)) return false;
          const xc = getCoords(x);
          if (xc) {
            for (const s of itinerary) {
              const sc = getCoords(s);
              if (sc) {
                const d = haversineKm(xc, sc);
                if (d != null && d < 0.05) return false; // ~50m
              }
            }
          }
          return true;
        });

      setDrawerData({
        ...res,
        hybrid: filterList(res.hybrid),
        nearby: filterList(res.nearby),
        top_rated: filterList(res.top_rated),
        same_type: filterList(res.same_type),
        similar_activities: filterList(res.similar_activities),
      });
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to load location options');
    } finally {
      setDrawerLoading(false);
    }
  };

  // -------- replace a stop locally (requires coords, but now we read many key names) --------
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
    };

    const edited = [...plan.itinerary];
    edited[index] = { ...edited[index], ...newStop };

    const { next, total } = recomputeDistances(edited);
    const updated = {
      ...plan,
      itinerary: next,
      total_distance_km: Number.isFinite(total) ? total : plan.total_distance_km,
    };

    setPlan(updated);
    try { sessionStorage.setItem('lastPlan', JSON.stringify(updated)); } catch {}
    toast.success('Stop replaced (pending optimization)');
    setDrawerOpen(false);
  };

  // -------- optimize route only when needed --------
  const onOptimize = async () => {
    try {
      setOptimizing(true);

      const itin = plan.itinerary || [];
      if (itin.length < 2) return;

      // Mark endpoints as cities; send only supported fields
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
          distance_from_prev: s.distance_from_prev
        };
      });

      const resp = await optimizePlan({
        itinerary: payloadItin,
        corridor_radius_km: corridor_radius_km ?? undefined,
      });

      if (resp?.status === 'ok' && Array.isArray(resp.itinerary) && resp.itinerary.length === itin.length) {
        let newItin = resp.itinerary;
        let newTotal = resp.total_distance_km;
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
        try { sessionStorage.setItem('lastPlan', JSON.stringify(nextPlan)); } catch {}
        toast.success('Route optimized');
      } else {
        const errMsg = resp?.detail?.error || resp?.error || 'Optimize failed';
        toast.error(errMsg);
      }
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Optimize failed');
    } finally {
      setOptimizing(false);
    }
  };

  // -------- drawer list (distance from selected stop) --------
  const ListBlock = ({ items }) => (
    <Stack gap="sm">
      {(!items || items.length === 0) ? (
        <Text c="dimmed" size="sm">No results.</Text>
      ) : items.map((x, i) => {
        const baseC = getCoords(baseStop);
        const xC = getCoords(x);
        const dBase = typeof x.distance_from_base_km === 'number'
          ? x.distance_from_base_km
          : (baseC && xC ? haversineKm(baseC, xC) : null);

        const isEndpoint = activeIndex === 0 || activeIndex === (plan.itinerary.length - 1);
        const hasCoords = !!xC;
        const disabledReason = isEndpoint ? 'Start/End cannot be replaced' : (!hasCoords ? 'No coordinates' : null);

        return (
          <Card key={`${x.location || x.name}-${i}`} withBorder radius="md" p="md" className="hover:shadow-sm transition-all">
            <Group justify="space-between" align="start">
              <div className="min-w-0">
                <Text fw={600} className="truncate">{x.location || x.name}</Text>
                <Group gap="xs" mt={6} wrap="wrap">
                  {x.type && <Badge variant="outline">{x.type}</Badge>}
                  {(x.province || x.Located_Province) && <Badge variant="outline">{x.province || x.Located_Province}</Badge>}
                  {toNum(x.avg_rating) !== null && (
                    <Badge variant="light" leftSection={<Star size={12} />}>
                      {toNum(x.avg_rating).toFixed(2)}
                    </Badge>
                  )}
                  {dBase != null && (
                    <Badge variant="light" leftSection={<Compass size={12} />}>
                      {km(dBase)}
                    </Badge>
                  )}
                </Group>
              </div>
              <Group gap="xs">
                {hasCoords && (
                  <Button size="xs" variant="default" onClick={() => openInMaps(xC.lat, xC.lng, x.location || x.name)}>
                    Map
                  </Button>
                )}
                {disabledReason ? (
                  <Tooltip label={disabledReason}>
                    <Button size="xs" variant="default" disabled leftSection={<Lock size={14} />}>
                      Replace
                    </Button>
                  </Tooltip>
                ) : (
                  <Button size="xs" onClick={() => replaceStopAt(activeIndex, x)} leftSection={<ReplaceIcon size={14} />}>
                    Replace
                  </Button>
                )}
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-12">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <Title order={2}>Itinerary</Title>
            <Text size="sm" c="dimmed">
              {(start?.name || itinerary[0]?.name || 'Start')} → {(end?.name || itinerary[itinerary.length - 1]?.name || 'End')}
            </Text>
          </div>
          <Group gap="xs">
            {needsOptimize && (
              <Button
                onClick={onOptimize}
                loading={optimizing}
                leftSection={<Sparkles size={16} />}
                variant="filled"
              >
                Optimize route
              </Button>
            )}
            <Button variant="default" onClick={() => navigate('/plan/build')}>Back to Builder</Button>
            <Button variant="default" onClick={() => navigate('/plan/saved')}>View Saved</Button>
            <Button
              onClick={() => {
                try {
                  const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'itinerary.json'; a.click();
                  URL.revokeObjectURL(url);
                } catch { toast.error('Failed to export'); }
              }}
            >
              Export JSON
            </Button>
            <Button loading={saving} onClick={onSave}>Save Itinerary</Button>
          </Group>
        </div>

        {/* Summary */}
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
              <Text size="sm" c="dimmed">{startProvince ? `Province: ${startProvince}` : ''}</Text>
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
              <Text size="sm" c="dimmed">{endProvince ? `Province: ${endProvince}` : ''}</Text>
            </div>

            <div className="space-y-2">
              <Text size="sm" c="dimmed">Trip summary</Text>
              <Group gap="xs">
                <Badge variant="light" leftSection={<RouteIcon size={14} />}>{km(total_distance_km)}</Badge>
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
                  {province_corridor.map((p) => (<Badge key={p} variant="outline">{p}</Badge>))}
                </Group>
              </div>
            </>
          ) : null}
        </Paper>

        {/* Timeline */}
        <Paper withBorder radius="lg" p="lg">
          <Timeline bulletSize={22} lineWidth={2} active={itinerary.length}>
            {itinerary.map((item, idx) => {
              const c = getCoords(item);
              const distance = item.distance_from_prev;
              const bullet = (<div className="rounded-full bg-gray-100 p-1"><RouteIcon size={14} /></div>);
              return (
                <Timeline.Item
                  key={`${item.name}-${idx}`}
                  bullet={bullet}
                  title={
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="text-left font-semibold hover:underline"
                          onClick={() => fetchOptionsFor(idx, item)}
                          title="Explore options for this stop"
                        >
                          {item.name}
                        </button>
                        {item.original_city_label && (
                          <Badge variant="outline" leftSection={<Info size={12} />}>
                            from city: {item.original_city_label}
                          </Badge>
                        )}
                        {(idx === 0 || idx === itinerary.length - 1) && (
                          <Badge variant="outline" leftSection={<Lock size={12} />}>
                            Fixed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {toNum(item.rating) !== null && (<Badge variant="light" leftSection={<Star size={12} />}>{toNum(item.rating).toFixed(2)}</Badge>)}
                        {distance != null && (<Badge variant="light">{km(distance)} from previous</Badge>)}
                        {c && (<Button size="xs" variant="default" onClick={() => openInMaps(c.lat, c.lng, item.name)}>Open in Maps</Button>)}
                        <Button size="xs" variant="default" onClick={() => fetchOptionsFor(idx, item)}>Explore</Button>
                      </div>
                    </div>
                  }
                >
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
      </div>

      {/* Right Drawer */}
      <Drawer
        opened={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        position="right"
        size="lg"
        title={<Group gap="xs"><ListChecks size={16} /><Text fw={700}>{drawerTitle || 'Options'}</Text></Group>}
      >
        {drawerLoading ? (
          <div className="flex items-center justify-center py-10"><Loader /></div>
        ) : !drawerData ? (
          <Text c="dimmed">No data.</Text>
        ) : (
          <Tabs defaultValue="hybrid" variant="pills">
            <Tabs.List>
              <Tabs.Tab value="hybrid">Hybrid</Tabs.Tab>
              <Tabs.Tab value="nearby">Nearby</Tabs.Tab>
              <Tabs.Tab value="top_rated">Top-rated</Tabs.Tab>
              <Tabs.Tab value="same_type">Same type</Tabs.Tab>
              <Tabs.Tab value="similar_activities">Similar activities</Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="hybrid" pt="md"><ListBlock items={drawerData.hybrid} /></Tabs.Panel>
            <Tabs.Panel value="nearby" pt="md"><ListBlock items={drawerData.nearby} /></Tabs.Panel>
            <Tabs.Panel value="top_rated" pt="md"><ListBlock items={drawerData.top_rated} /></Tabs.Panel>
            <Tabs.Panel value="same_type" pt="md"><ListBlock items={drawerData.same_type} /></Tabs.Panel>
            <Tabs.Panel value="similar_activities" pt="md"><ListBlock items={drawerData.similar_activities} /></Tabs.Panel>
          </Tabs>
        )}
      </Drawer>
    </div>
  );
}
