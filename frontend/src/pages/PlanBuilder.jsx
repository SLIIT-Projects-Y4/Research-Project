import React, { useEffect, useMemo, useState } from 'react';
import {
  Button, Combobox, InputBase, NumberInput, Paper, Switch, Text, useCombobox,
  Group, Stack, Card, Badge, Divider, LoadingOverlay
} from '@mantine/core';
import { toast } from 'react-toastify';
import { getPlanPool } from '../api/planpool';
import { generatePlan } from '../api/planner';
import { api } from '@/api/client';
import { useNavigate } from "react-router-dom";
import {
  IconMapPin, IconNavigation, IconSparkles, IconClock, IconChevronDown,
  IconCurrentLocation, IconWorld, IconGps, IconArrowsMove, IconBuilding, IconSettings
} from '@tabler/icons-react';

// ------- Shared Mantine combobox for cities -------
function CustomCombobox({ label, value, onChange, cities, disabled, icon: Icon, placeholder, description }) {
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
        <Text size="sm" fw={600} c="var(--color-midnight-dreams)">{label}</Text>
      </Group>
      {description && <Text size="xs" c="dimmed" mb={4}>{description}</Text>}

      <Combobox
        store={combobox}
        onOptionSubmit={(val) => { onChange(val); setSearch(''); combobox.closeDropdown(); }}
        disabled={disabled}
      >
        <Combobox.Target>
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
                backgroundColor: 'var(--mantine-color-white)',
                height: '48px',
                padding: '0 1rem',
              },
            }}
          >
            {value ? (
              <Text c="var(--color-midnight-dreams)" fw={500}>{value}</Text>
            ) : (
              <Text c="dimmed">{placeholder || 'Select a city'}</Text>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Combobox.Search
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Search cities..."
          />
          <Combobox.Options>
            {filtered.length === 0 ? (
              <Combobox.Empty>No cities found</Combobox.Empty>
            ) : (
              filtered.map((city) => (
                <Combobox.Option value={city} key={city}>
                  <Group gap="sm">
                    <IconMapPin size={16} />
                    <Text>{city}</Text>
                  </Group>
                </Combobox.Option>
              ))
            )}
          </Combobox.Options>
        </Combobox.Dropdown>
      </Combobox>
    </Stack>
  );
}

// --------------- Main ---------------
export default function PlanBuilder() {
  const navigate = useNavigate();

  // loading states
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // user plan pool (saved locations)
  const [pool, setPool] = useState([]);

  // cities for combobox
  const [cities, setCities] = useState([]);

  // form state
  const [useStartCoords, setUseStartCoords] = useState(false);
  const [startCity, setStartCity] = useState('');
  const [startCoords, setStartCoords] = useState(null);
  const [endCity, setEndCity] = useState('');

  const [includeCityAttractions, setIncludeCityAttractions] = useState(false);
  const [cityAttractionRadiusKm, setCityAttractionRadiusKm] = useState(40);
  const [minAttractions, setMinAttractions] = useState(3);
  const [corridorRadiusKm, setCorridorRadiusKm] = useState(100);

  // load plan pool + cities
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);

        // 1) user’s saved locations
        const poolRes = await getPlanPool();
        const items = Array.isArray(poolRes?.data) ? poolRes.data : (poolRes?.data?.data || []);
        setPool(items);

        // 2) all cities from Node (so start/end aren’t limited to pool cities)
        const { data } = await api.get('/api/locations/cities');
        const list = Array.isArray(data?.data) ? data.data : data;
        const allCities = (list || []).map(String);

        // fallback: if API fails, at least use cities from pool
        const poolCities = Array.from(new Set(items.map((i) => i.city).filter(Boolean))).map(String);
        const merged = Array.from(new Set([ ...allCities, ...poolCities ])).sort((a, b) => a.localeCompare(b));

        setCities(merged);
      } catch {
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // geolocation
  const tryGetStartLocation = async () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported');
      return;
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(6)),
            lng: Number(pos.coords.longitude.toFixed(6)),
          };
          setUseStartCoords(true);
          setStartCoords(coords);
          setStartCity('');
          toast.success('Current location captured!');
          resolve();
        },
        (err) => {
          toast.error(err?.message || 'Unable to get current location');
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const validate = () => {
    if (useStartCoords && !startCoords) { toast.error('Start location not set'); return false; }
    if (!useStartCoords && !startCity) { toast.error('Please select a start city'); return false; }
    if (!endCity) { toast.error('Please select an end city'); return false; }
    if (!(corridorRadiusKm > 0)) { toast.error('Enter a valid corridor radius'); return false; }
    if (!pool.length) { toast.error('Your plan pool is empty'); return false; }
    return true;
  };

  const onGenerate = async () => {
    if (!validate()) return;
    setGenerating(true);

    // Use ALL saved locations (by name) for the plan pool
    const planPoolNames = Array.from(new Set((pool || []).map((p) => p?.name).filter(Boolean)));

    const body = {
      start_city: useStartCoords ? null : startCity,
      end_city: endCity,
      plan_pool: planPoolNames,
      include_city_attractions: !!includeCityAttractions,
      city_attraction_radius_km: includeCityAttractions ? Number(cityAttractionRadiusKm) : null,
      min_attractions: Number(minAttractions),
      corridor_radius_km: Number(corridorRadiusKm),
      ...(useStartCoords && startCoords ? { start_lat: startCoords.lat, start_lng: startCoords.lng } : {}),
    };

    try {
      const res = await generatePlan(body);
      const out = res?.data ?? res;           // unwrap Node envelope if present
      const payload = out?.data ?? out;       // extra safety for double-wrapped libs

      if (payload?.status === 'ok') {
        sessionStorage.setItem('lastPlan', JSON.stringify(payload));
        toast.success('Plan generated successfully!');
        navigate('/plan/itinerary', { state: payload });
      } else {
        toast.error('Planner returned an unexpected response');
      }
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        || err?.response?.data?.detail
        || err?.message
        || 'Failed to generate plan';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen py-16 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <Stack gap="xl" mb="xl">
          <Text size="3.5rem" fw={800} lh={1.1} className="font-display" c="var(--color-midnight-dreams)" mt="xl" >
            Craft Your <Text component="span" c="var(--color-brave-orange)" inherit>Perfect</Text> Trip
          </Text>
          <Text size="lg" c="dimmed" maw={700} lh={1.6}>
            We’ll use your saved places to build an efficient route. Pick start/end and preferences below.
          </Text>
        </Stack>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main */}
          <Card shadow="xl" padding="xl" radius="lg" withBorder className="lg:col-span-2" style={{ backgroundColor: 'var(--color-lynx-white)' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
            <Stack gap="xl">
              {/* Journey points */}
              <Stack gap="lg">
                <Group>
                  <IconNavigation size={28} color="var(--color-brave-orange)" />
                  <Text size="xl" fw={700} c="var(--color-midnight-dreams)">Journey Points</Text>
                </Group>
                <Divider />

                <CustomCombobox
                  label="Start City"
                  value={useStartCoords ? '' : startCity}
                  onChange={setStartCity}
                  cities={cities}
                  disabled={useStartCoords}
                  icon={IconGps}
                  placeholder="Choose your starting city"
                />

                <Group gap="sm">
                  <Button
                    variant={useStartCoords ? 'filled' : 'light'}
                    color={useStartCoords ? 'orange' : 'gray'}
                    leftSection={<IconCurrentLocation size={18} />}
                    onClick={() => useStartCoords ? (setUseStartCoords(false), setStartCoords(null)) : tryGetStartLocation()}
                    radius="md"
                    size="sm"
                  >
                    {useStartCoords ? 'Using Current Location' : 'Use Current Location'}
                  </Button>
                  {useStartCoords && startCoords && (
                    <Badge leftSection={<IconMapPin size={12} />} color="teal" variant="light" size="lg">
                      {startCoords.lat}, {startCoords.lng}
                    </Badge>
                  )}
                </Group>

                <Divider />

                <CustomCombobox
                  label="End City"
                  value={endCity}
                  onChange={setEndCity}
                  cities={cities}
                  icon={IconBuilding}
                  placeholder="Choose your destination city"
                  description="This will be the final stop on your journey."
                />
              </Stack>

              <Divider />

              {/* Route prefs */}
              <Stack gap="lg">
                <Group>
                  <IconSettings size={28} color="var(--color-brave-orange)" />
                  <Text size="xl" fw={700} c="var(--color-midnight-dreams)">Route Preferences</Text>
                </Group>
                <Divider />

                <div className="grid sm:grid-cols-2 gap-6">
                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconArrowsMove size={16} />
                      <Text size="sm" fw={600} c="var(--color-midnight-dreams)">Corridor Radius (km)</Text>
                    </Group>
                    <NumberInput value={corridorRadiusKm} onChange={setCorridorRadiusKm} min={20} max={300} clampBehavior="strict" placeholder="e.g., 100" size="md" radius="md" />
                    <Text size="xs" c="dimmed">How far to search along your route.</Text>
                  </Stack>

                  <Stack gap="xs">
                    <Group gap="xs">
                      <IconSparkles size={16} />
                      <Text size="sm" fw={600} c="var(--color-midnight-dreams)">Minimum Attractions</Text>
                    </Group>
                    <NumberInput value={minAttractions} onChange={setMinAttractions} min={1} max={20} clampBehavior="strict" size="md" radius="md" />
                    <Text size="xs" c="dimmed">Minimum POIs to include.</Text>
                  </Stack>
                </div>

                <Card padding="md" radius="md" withBorder>
                  <Group justify="space-between" align="center">
                    <Stack gap={2}>
                      <Text size="sm" fw={600} c="var(--color-midnight-dreams)">Include Province Attractions</Text>
                      <Text size="xs" c="dimmed">Popular sights near each city (province-based).</Text>
                    </Stack>
                    <Switch checked={includeCityAttractions} onChange={(e) => setIncludeCityAttractions(e.currentTarget.checked)} size="lg" color="orange" />
                  </Group>
                  {includeCityAttractions && (
                    <NumberInput
                      mt="xs"
                      label="Attractions radius (km)"
                      value={cityAttractionRadiusKm}
                      onChange={setCityAttractionRadiusKm}
                      min={10}
                      max={150}
                      clampBehavior="strict"
                    />
                  )}
                </Card>
              </Stack>
            </Stack>
          </Card>

          {/* Summary & Generate */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card shadow="xl" padding="xl" radius="lg" withBorder style={{ backgroundColor: 'var(--color-lynx-white)' }}>
                <Stack gap="lg">
                  <Group gap="xs">
                    <IconClock size={24} color="var(--color-brave-orange)" />
                    <Text size="lg" fw={700} c="var(--color-midnight-dreams)">Trip Summary</Text>
                  </Group>
                  <Divider />
                  <Stack gap="xs">
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Saved places in pool</Text>
                      <Badge size="lg" variant="light" color="blue">{pool.length}</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Start</Text>
                      <Badge size="lg" variant="light" color="blue">
                        {useStartCoords ? 'Current Location' : startCity || 'Not set'}
                      </Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">End</Text>
                      <Badge size="lg" variant="light" color="grape">{endCity || 'Not set'}</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Corridor radius</Text>
                      <Badge size="lg" variant="light" color="cyan">{corridorRadiusKm} km</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Min attractions</Text>
                      <Badge size="lg" variant="light" color="pink">{minAttractions}</Badge>
                    </Group>
                    <Group justify="space-between" py="xs">
                      <Text size="sm" c="dimmed">Province attractions</Text>
                      <Badge size="lg" variant="light" color={includeCityAttractions ? 'orange' : 'gray'}>
                        {includeCityAttractions ? `Included (${cityAttractionRadiusKm} km)` : 'Excluded'}
                      </Badge>
                    </Group>
                  </Stack>
                  <Button
                    onClick={onGenerate}
                    loading={generating}
                    disabled={loading || !validate()}
                    size="lg"
                    radius="xl"
                    leftSection={<IconSparkles size={20} />}
                    color="orange"
                    fullWidth
                  >
                    {generating ? 'Generating…' : 'Generate Perfect Plan'}
                  </Button>
                </Stack>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
