import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Badge, Button, Card, Checkbox, Combobox, Divider, Group, InputBase, Loader,
  NumberInput, Paper, Slider, Stack, Switch, Text, Title, useCombobox,
} from '@mantine/core';
import { api } from '@/api/client';
import { getPlanPool } from '@/api/planpool';
import {
  IconArrowsMove, IconBuilding, IconChevronDown, IconClock, IconCurrentLocation, IconGps,
  IconMapPin, IconNavigation, IconSettings, IconSparkles
} from '@tabler/icons-react';

function ItineraryPreview({ data }) {
  if (!data) return null;
  const { itinerary = [], total_distance_km } = data;
  return (
    <Paper withBorder p="lg" radius="lg" className="mt-8">
      <Group justify="space-between" mb="sm">
        <Title order={4}>Plan Preview</Title>
        <Badge size="lg" variant="light">
          Total: {total_distance_km?.toFixed?.(1) ?? total_distance_km} km
        </Badge>
      </Group>
      <Divider my="sm" />
      <Stack gap="xs">
        {itinerary.map((s, i) => (
          <Group key={`${s.location_id ?? s.name}-${i}`} justify="space-between" className="rounded-lg border border-gray-200 p-3">
            <div>
              <div className="font-semibold">
                {i + 1}. {s.name}{' '}
                {s.type ? (
                  <Badge ml="xs" size="xs" variant="light">{s.type}</Badge>
                ) : s.is_city ? (
                  <Badge ml="xs" size="xs" variant="light" color="gray">City</Badge>
                ) : null}
              </div>
              <div className="text-sm text-gray-600">
                {[s.city, s.province].filter(Boolean).join(' · ')}
              </div>
            </div>
            <div className="text-sm">
              {i === 0 ? (
                <Badge variant="dot" color="green">Start</Badge>
              ) : i === itinerary.length - 1 ? (
                <Badge variant="dot" color="blue">End</Badge>
              ) : (
                <span>{s.distance_from_prev?.toFixed?.(1) ?? s.distance_from_prev} km</span>
              )}
            </div>
          </Group>
        ))}
      </Stack>
    </Paper>
  );
}

function CityCombobox({ label, value, onChange, cities, disabled, icon: Icon, placeholder, description, rightAdornment }) {
  const [search, setSearch] = useState('');
  const combobox = useCombobox();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((c) => c.toLowerCase().includes(q));
  }, [search, cities]);

  return (
    <Stack gap="xs">
      <Group gap="xs" mb={-8}>
        {Icon && <Icon size={18} />}
        <Text size="sm" fw={600}>{label}</Text>
      </Group>
      {description && <Text size="xs" c="dimmed" mb={4}>{description}</Text>}

      <Combobox
        store={combobox}
        onOptionSubmit={(val) => { onChange(val); setSearch(''); combobox.closeDropdown(); }}
        disabled={disabled}
      >
        <Combobox.Target>
          <div className="relative">
            <InputBase
              component="button"
              type="button"
              pointer
              rightSection={<IconChevronDown size={18} />}
              rightSectionPointerEvents="none"
              onClick={() => !disabled && combobox.toggleDropdown()}
              styles={{
                input: {
                  border: '1px solid var(--mantine-color-gray-3)',
                  borderRadius: 'var(--mantine-radius-md)',
                  backgroundColor: disabled ? 'var(--mantine-color-gray-1)' : 'var(--mantine-color-white)',
                  height: '48px',
                  padding: '0 1rem',
                  textAlign: 'left',
                },
              }}
            >
              {value ? <Text fw={500}>{value}</Text> : <Text c="dimmed">{placeholder || 'Select a city'}</Text>}
            </InputBase>
            {rightAdornment ? (
              <div className="absolute -top-2 right-2">{rightAdornment}</div>
            ) : null}
          </div>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search value={search} onChange={(e) => setSearch(e.currentTarget.value)} placeholder="Search cities..." />
          <Combobox.Options>
            {filtered.length === 0 ? (
              <Combobox.Empty>No cities found</Combobox.Empty>
            ) : (
              filtered.map((city) => (
                <Combobox.Option value={city} key={city}>
                  <Group gap="sm"><IconMapPin size={16} /><Text>{city}</Text></Group>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Stack>
  );
}

export default function PlanCreatePage() {
  const navigate = useNavigate();

  // cities & plan pool
  const [cities, setCities] = useState([]);
  const [pool, setPool] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  // loading
  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingPool, setLoadingPool] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // journey
  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [useCurrent, setUseCurrent] = useState(false);
  const [geo, setGeo] = useState({ lat: null, lng: null, ready: false });
  const [resolvedCity, setResolvedCity] = useState(''); // snapped city display

  // prefs (no minimum attractions per your note)
  const [corridorRadius, setCorridorRadius] = useState(100);
  const [includeAttractions, setIncludeAttractions] = useState(false);
  const [fillRadius, setFillRadius] = useState(40);
  const [topFillPerCity, setTopFillPerCity] = useState(5);

  // load cities + pool
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingCities(true);
        const { data } = await api.get('/api/locations/cities');
        if (!mounted) return;
        const list = Array.isArray(data?.data) ? data.data : data;
        setCities((list || []).map(String));
      } catch {
        toast.error('Failed to load cities');
      } finally {
        if (mounted) setLoadingCities(false);
      }
    })();

    (async () => {
      try {
        setLoadingPool(true);
        const res = await getPlanPool();
        const items = Array.isArray(res?.data) ? res.data : (res?.data?.data || []);
        const norm = (items || [])
          .map((p) => ({
            id: p.location_id || p.id || `${p.name}-${p.city}`,
            name: p.name,
            city: p.city || '',
            province: p.province || '',
            lat: p.lat, lng: p.lng,
          }))
          .filter((p) => p.name);
        setPool(norm);
        setSelectedIds(norm.map((p) => p.id)); // default select all
      } catch {
        toast.error('Failed to load your saved places');
      } finally {
        setLoadingPool(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // geolocation + resolve city (optional endpoint)
  const requestGeolocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      setUseCurrent(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        setGeo({ lat, lng, ready: true });

        // Try to resolve the city name from backend (optional helper)
        try {
          // If you add this tiny endpoint in Node, it will show the snapped city in UI:
          // GET /api/locations/nearest-city?lat=...&lng=...
          const { data } = await api.get('/api/locations/nearest-city', { params: { lat, lng } });
          const city = data?.data?.city || '';
          setResolvedCity(city);
        } catch {
          // Fallback: show placeholder; backend will still snap city during plan generation
          setResolvedCity('');
        }

        toast.success('Got current location');
      },
      (err) => {
        console.error(err);
        toast.error('Failed to get current location');
        setUseCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (useCurrent) {
      setStartCity('');
      setResolvedCity('');
      requestGeolocation();
    } else {
      setGeo({ lat: null, lng: null, ready: false });
      setResolvedCity('');
    }
  }, [useCurrent]);

  const selectedPool = useMemo(() => {
    const setIds = new Set(selectedIds);
    return pool.filter((p) => setIds.has(p.id));
  }, [pool, selectedIds]);

  const canSubmit = useMemo(() => {
    if (!endCity) return false;
    if (!useCurrent && !startCity) return false;
    if (useCurrent && !(geo.ready && typeof geo.lat === 'number' && typeof geo.lng === 'number')) return false;
    if (!selectedPool.length) return false;
    return true;
  }, [useCurrent, startCity, endCity, geo, selectedPool.length]);

  const buildPayload = () => {
    const plan_pool = Array.from(new Set(selectedPool.map((p) => p.name))).filter(Boolean); // names only
    const base = {
      end_city: endCity,
      plan_pool,
      include_city_attractions: includeAttractions,
      city_attraction_radius_km: includeAttractions ? Number(fillRadius) : null,
      corridor_radius_km: Number(corridorRadius),
      top_fill_per_city: Number(topFillPerCity),
    };
    if (useCurrent) {
      return { ...base, use_current_location: true, start_lat: Number(geo.lat), start_lng: Number(geo.lng) };
    }
    return { ...base, start_city: startCity };
  };

  const submit = async () => {
    if (!canSubmit) {
      toast.info('Please complete the required fields');
      return;
    }
    try {
      setSubmitting(true);
      const payload = buildPayload();
      const { data } = await api.post('/api/plan/generate', payload);
      const out = data?.data ?? data;
      if (out?.status === 'ok') {
        sessionStorage.setItem('lastPlan', JSON.stringify(out));
        toast.success('Plan generated');
        navigate('/plan/itinerary', { state: out });
      } else {
        toast.error('Planner returned an unexpected response');
      }
    } catch (e) {
      const msg = e?.response?.data?.error?.details?.detail || e?.response?.data?.detail || 'Failed to generate plan';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAll = (check) => {
    setSelectedIds(check ? pool.map((p) => p.id) : []);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <Title order={2} mb="sm">Create your plan</Title>
        <Text c="dimmed" mb="lg">
          We’ll use your <b>saved places</b> (Plan Pool) to build an efficient route. Pick start/end and preferences below.
        </Text>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main form */}
          <Card shadow="xl" padding="xl" radius="lg" withBorder className="lg:col-span-2" style={{ backgroundColor: 'var(--color-lynx-white)' }}>
            <Stack gap="xl">
              {/* Journey points */}
              <Stack gap="lg">
                <Group>
                  <IconNavigation size={28} color="var(--color-brave-orange)" />
                  <Text size="xl" fw={700}>Journey Points</Text>
                </Group>
                <Divider />

                <CityCombobox
                  label="Start City"
                  value={useCurrent ? (resolvedCity || '') : startCity}
                  onChange={setStartCity}
                  cities={cities}
                  disabled={useCurrent || loadingCities}
                  icon={IconGps}
                  placeholder={useCurrent ? (resolvedCity ? 'Resolved from location' : 'Auto (nearest city)') : (loadingCities ? 'Loading cities…' : 'Choose start city')}
                  rightAdornment={useCurrent ? (
                    <Badge size="xs" variant="light" color={resolvedCity ? 'teal' : 'gray'}>
                      {resolvedCity ? 'GPS matched' : 'Auto'}
                    </Badge>
                  ) : null}
                />

                <Group gap="sm">
                  <Switch
                    checked={useCurrent}
                    onChange={(e) => setUseCurrent(e.currentTarget.checked)}
                    label="Use my current location (snaps to nearest city)"
                  />
                  {useCurrent && (
                    <Badge leftSection={<IconMapPin size={12} />} color={geo.ready ? 'teal' : 'gray'} variant="light" size="lg">
                      {geo.ready ? `${geo.lat?.toFixed?.(4)}, ${geo.lng?.toFixed?.(4)}` : 'Locating…'}
                    </Badge>
                  )}
                </Group>

                <CityCombobox
                  label="End City"
                  value={endCity}
                  onChange={setEndCity}
                  cities={cities}
                  disabled={loadingCities}
                  icon={IconBuilding}
                  placeholder={loadingCities ? 'Loading cities…' : 'Choose end city'}
                />
              </Stack>

              <Divider />

              {/* Saved places (Plan Pool) */}
              <Stack gap="lg">
                <Group>
                  <IconSettings size={28} color="var(--color-brave-orange)" />
                  <Text size="xl" fw={700}>Saved Places (Plan Pool)</Text>
                </Group>
                <Divider />
                {loadingPool ? (
                  <Group gap="sm"><Loader size="sm" /><Text c="dimmed">Loading your saved places…</Text></Group>
                ) : pool.length === 0 ? (
                  <Text c="dimmed">Your plan pool is empty. Add locations from the recommendations page.</Text>
                ) : (
                  <Stack gap="xs">
                    <Group justify="space-between" mb="xs">
                      <Text size="sm" c="dimmed">Select which saved places to include in this plan.</Text>
                      <Group gap="xs">
                        <Button size="xs" variant="light" onClick={() => toggleAll(true)}>Select all</Button>
                        <Button size="xs" variant="light" onClick={() => toggleAll(false)}>Clear</Button>
                      </Group>
                    </Group>
                    <Checkbox.Group value={selectedIds} onChange={setSelectedIds}>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {pool.map((p) => (
                          <Checkbox
                            key={p.id}
                            value={p.id}
                            label={
                              <div className="flex flex-col">
                                <span className="font-medium">{p.name}</span>
                                <span className="text-xs text-gray-600">{[p.city, p.province].filter(Boolean).join(' · ')}</span>
                              </div>
                            }
                          />
                        ))}
                      </div>
                    </Checkbox.Group>
                  </Stack>
                )}
              </Stack>

              <Divider />

              {/* Preferences (no min-attractions) */}
              <Stack gap="lg">
                <Group>
                  <IconSparkles size={28} color="var(--color-brave-orange)" />
                  <Text size="xl" fw={700}>Route Preferences</Text>
                </Group>
                <Divider />

                <div className="grid sm:grid-cols-3 gap-6">
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconArrowsMove size={16} />
                      <Text size="sm" fw={600}>Corridor radius (km)</Text>
                    </Group>
                    <Slider
                      value={corridorRadius}
                      onChange={setCorridorRadius}
                      min={20} max={250} step={5}
                      marks={[{ value: 50, label: '50' }, { value: 100, label: '100' }, { value: 150, label: '150' }, { value: 200, label: '200' }]}
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="sm" fw={600}>Include province attractions</Text>
                    <Switch
                      checked={includeAttractions}
                      onChange={(e) => setIncludeAttractions(e.currentTarget.checked)}
                      label={includeAttractions ? 'Enabled' : 'Disabled'}
                    />
                    {includeAttractions && (
                      <>
                        <NumberInput
                          mt="xs"
                          label="Attractions radius (km)"
                          value={fillRadius}
                          onChange={(v) => setFillRadius(Number(v || 0))}
                          min={10}
                          max={150}
                        />
                        <NumberInput
                          mt="xs"
                          label="Top fill per city"
                          value={topFillPerCity}
                          onChange={(v) => setTopFillPerCity(Number(v || 0))}
                          min={1}
                          max={20}
                        />
                      </>
                    )}
                  </Stack>

                  <div className="hidden sm:block" />
                </div>
              </Stack>

              <Group justify="flex-end" mt="md">
                <Button
                  loading={submitting}
                  disabled={!canSubmit}
                  onClick={submit}
                  leftSection={<IconSparkles size={18} />}
                  color="orange"
                >
                  Generate Plan
                </Button>
              </Group>
            </Stack>
          </Card>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card shadow="xl" padding="xl" radius="lg" withBorder style={{ backgroundColor: 'var(--color-lynx-white)' }}>
                <Stack gap="lg">
                  <Group gap="xs">
                    <IconClock size={24} color="var(--color-brave-orange)" />
                    <Text size="lg" fw={700}>Trip Summary</Text>
                  </Group>
                  <Divider />
                  <Stack gap="xs">
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Selected places</Text>
                      <Badge size="lg" variant="light" color="blue">{selectedPool.length}</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Start</Text>
                      <Badge size="lg" variant="light" color="blue">
                        {useCurrent ? (resolvedCity || 'Auto (nearest)') : (startCity || 'Not set')}
                      </Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">End</Text>
                      <Badge size="lg" variant="light" color="grape">{endCity || 'Not set'}</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Corridor radius</Text>
                      <Badge size="lg" variant="light" color="cyan">{corridorRadius} km</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Province attractions</Text>
                      <Badge size="lg" variant="light" color={includeAttractions ? 'orange' : 'gray'}>
                        {includeAttractions ? `Included (${fillRadius} km)` : 'Excluded'}
                      </Badge>
                    </Group>
                  </Stack>
                </Stack>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
