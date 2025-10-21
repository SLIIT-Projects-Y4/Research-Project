import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Autocomplete, Badge, Button, Card, Checkbox, Container, Divider, Group,
  NumberInput, Paper, ScrollArea, Slider, Stack, Switch, Text, Title, rem
} from '@mantine/core';
import { api } from '@/api/client';
import { getPlanPool } from '@/api/planpool';
import {
  IconArrowsMove, IconBuilding, IconChevronDown, IconClock, IconCurrentLocation, IconGps,
  IconMapPin, IconNavigation, IconSettings, IconSparkles
} from '@tabler/icons-react';
import { useViewportSize } from '@mantine/hooks';

const UI = {
  gapXxs: 4,
  gapXs: 6,
  gapSm: 8,
  gapMd: 12,
  gapLg: 16,
  gapXl: 20,
  padSm: 'sm',
  padMd: 'md',
  padLg: 'lg',
  iconSm: 14,
  iconMd: 16,
  iconLg: 20,
  textTiny: 'xs',
  textSm: 'sm',
};

const CityAutocomplete = React.memo(function CityAutocomplete({
  label,
  value,
  onChange,
  cities,
  disabled,
  icon: Icon,
  placeholder,
  description,
  rightSection,
}) {
  const options = useMemo(() => cities ?? [], [cities]);

  return (
    <Stack gap="xs">
      <Group gap="xs" mb={2} align="center">
        {Icon ? <Icon size={UI.iconLg - 2} style={{ color: 'var(--color-brave-orange)' }} /> : null}
        <Text size={UI.textSm} fw={600} className="font-display" style={{ color: 'var(--color-midnight-dreams)' }}>
          {label}
        </Text>
      </Group>

      {description ? (
        <Text size={UI.textTiny} c="dimmed" mb={6} className="font-body">
          {description}
        </Text>
      ) : null}

      <Autocomplete
        aria-label={label}
        data={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder || 'Select a city'}
        disabled={disabled}
        radius="md"
        size="md"
        limit={25}
        maxDropdownHeight={260}
        rightSection={rightSection}
        styles={{
          input: {
            backgroundColor: disabled ? 'var(--color-lynx-white)' : 'white',
            border: '2px solid var(--color-heart-of-ice)',
            transition: 'all .18s ease',
            '&:focus': { borderColor: 'var(--color-brave-orange)' },
            '&:hover': { borderColor: 'var(--color-ocean-depths)' },
          },
          dropdown: { border: '2px solid var(--color-heart-of-ice)' },
        }}
      />
    </Stack>
  );
});

export default function PlanCreatePage() {
  const navigate = useNavigate();

  const [cities, setCities] = useState([]);
  const [pool, setPool] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);

  const [loadingCities, setLoadingCities] = useState(true);
  const [loadingPool, setLoadingPool] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [startCity, setStartCity] = useState('');
  const [endCity, setEndCity] = useState('');
  const [useCurrent, setUseCurrent] = useState(false);
  const [geo, setGeo] = useState({ lat: null, lng: null, ready: false });
  const [resolvedCity, setResolvedCity] = useState('');

  const [corridorRadius, setCorridorRadius] = useState(40);
  const [includeAttractions, setIncludeAttractions] = useState(false);
  const [fillRadius, setFillRadius] = useState(40);
  const [topFillPerCity, setTopFillPerCity] = useState(5);

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
        mounted && setLoadingCities(false);
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
            lat: p.lat,
            lng: p.lng,
          }))
          .filter((p) => p.name);
        setPool(norm);
        setSelectedIds(norm.map((p) => p.id));
      } catch {
        toast.error('Failed to load your saved places');
      } finally {
        setLoadingPool(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const requestGeolocation = useCallback(async () => {
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

        try {
          const { data } = await api.get('/api/locations/nearest-city', { params: { lat, lng } });
          setResolvedCity(data?.data?.city || '');
        } catch {
          setResolvedCity('');
        }
        toast.success('Got current location');
      },
      () => {
        toast.error('Failed to get current location');
        setUseCurrent(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    if (useCurrent) {
      setStartCity('');
      setResolvedCity('');
      requestGeolocation();
    } else {
      setGeo({ lat: null, lng: null, ready: false });
      setResolvedCity('');
    }
  }, [useCurrent, requestGeolocation]);

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

  const buildPayload = useCallback(() => {
    const plan_pool = Array.from(new Set(selectedPool.map((p) => p.name))).filter(Boolean);
    const base = {
      end_city: endCity,
      plan_pool,
      include_city_attractions: includeAttractions,
      city_attraction_radius_km: includeAttractions ? Number(fillRadius) : null,
      corridor_radius_km: Number(corridorRadius),
      top_fill_per_city: Number(topFillPerCity),
    };
    return useCurrent
      ? { ...base, use_current_location: true, start_lat: Number(geo.lat), start_lng: Number(geo.lng) }
      : { ...base, start_city: startCity };
  }, [selectedPool, endCity, includeAttractions, fillRadius, corridorRadius, topFillPerCity, useCurrent, geo, startCity]);

  const submit = useCallback(async () => {
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
      const msg =
        e?.response?.data?.error?.details?.detail ||
        e?.response?.data?.detail ||
        'Failed to generate plan';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, buildPayload, navigate]);

  const { width } = useViewportSize();
  const isMobile = width < 768;

  return (
    <div
      style={{
        paddingLeft: `${width < 1023 ? '14px' : '56px'}`,
        paddingRight: `${width < 1023 ? '14px' : '56px'}`,
      }}
      className="min-h-screen mt-8"
    >
      <Container size="lg" py={rem(52)}>
        <div className="text-left mb-6">
          <h1 className="font-display font-bold text-brave-orange leading-tight text-2xl sm:text-4xl lg:text-5xl">
            Generate Plan
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card
              padding="lg"
              radius="xl"
              withBorder
              style={{ backgroundColor: 'white', borderColor: 'var(--color-heart-of-ice)', borderWidth: '2px' }}
            >
              <Stack gap="lg">
                <div>
                  <Group mb="md">
                    <Paper p="xs" radius="lg" style={{ backgroundColor: 'var(--color-heart-of-ice)' }}>
                      <IconNavigation size={UI.iconLg} style={{ color: 'var(--color-midnight-dreams)' }} />
                    </Paper>
                    <div>
                      <Title order={4} className="font-display" style={{ color: 'var(--color-midnight-dreams)' }}>
                        Journey Points
                      </Title>
                      <Text size={UI.textSm} c="dimmed" className="font-body">
                        Select your starting point and destination
                      </Text>
                    </div>
                  </Group>

                  <Stack gap="md">
                    <CityAutocomplete
                      label="Start City"
                      value={useCurrent ? resolvedCity || '' : startCity}
                      onChange={setStartCity}
                      cities={cities}
                      disabled={useCurrent || loadingCities}
                      icon={IconGps}
                      placeholder={
                        useCurrent
                          ? resolvedCity
                            ? 'Resolved from location'
                            : 'Nearest City Selected'
                          : loadingCities
                            ? 'Loading cities…'
                            : 'Choose start city'
                      }
                      rightSection={
                        useCurrent ? (
                          <Badge size="xs" radius="sm" variant="filled" color={resolvedCity ? 'teal' : 'gray'}>
                            {resolvedCity ? 'GPS' : 'Auto'}
                          </Badge>
                        ) : (
                          <IconChevronDown size={UI.iconMd - 2} />
                        )
                      }
                    />

                    <Paper p="xs" radius="md" style={{ backgroundColor: 'var(--color-heart-of-ice)' }}>
                      <Group gap="md" align="center" wrap="nowrap">
                        <Switch
                          checked={useCurrent}
                          onChange={(e) => setUseCurrent(e.currentTarget.checked)}
                          size="sm"
                          color="orange"
                          aria-label="Use my current location"
                        />
                        <div className="flex-1 min-w-0">
                          <Text fw={500} className="font-display">
                            Use my current location
                          </Text>
                          <Text size={UI.textTiny} c="dimmed" className="font-body">
                            Automatically snap to nearest city
                          </Text>
                        </div>
                        {useCurrent && (
                          <Badge
                            leftSection={<IconCurrentLocation size={10} />}
                            color={geo.ready ? 'teal' : 'orange'}
                            variant="filled"
                            size="sm"
                            radius="md"
                          >
                            {geo.ready ? `${geo.lat?.toFixed?.(4)}, ${geo.lng?.toFixed?.(4)}` : 'Locating…'}
                          </Badge>
                        )}
                      </Group>
                    </Paper>

                    <CityAutocomplete
                      label="End City"
                      value={endCity}
                      onChange={setEndCity}
                      cities={cities}
                      disabled={loadingCities}
                      icon={IconBuilding}
                      placeholder={loadingCities ? 'Loading cities…' : 'Choose end city'}
                      rightSection={<IconChevronDown size={UI.iconMd - 2} />}
                    />
                  </Stack>
                </div>

                <Divider color="var(--color-heart-of-ice)" size="sm" />

                <div>
                  <Title order={4} className="font-display" style={{ color: 'var(--color-midnight-dreams)' }}>
                    Saved Plans
                  </Title>
                  <Text size={UI.textSm} c="dimmed" className="font-body">
                    Select your preffered destinations
                  </Text>
                </div>

                <Paper
                  p="sm"
                  radius="md"
                  withBorder
                  style={{ backgroundColor: 'var(--color-lynx-white)', borderColor: 'var(--color-heart-of-ice)' }}
                >
                  <Checkbox.Group value={selectedIds} onChange={setSelectedIds}>
                    {pool.length > 10 ? (
                      <ScrollArea.Autosize
                        mah={isMobile ? 360 : 500}
                        mx="auto"
                        scrollbars="xy"
                        type="hover"
                        offsetScrollbars
                      >
                        <div
                          className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3"
                          style={{ minWidth: 'max-content', width: 'fit-content' }}
                        >
                          {pool.map((p) => (
                            <Paper
                              key={p.id}
                              p="sm"
                              radius="md"
                              withBorder
                              style={{
                                minWidth: rem(248),
                                backgroundColor: 'white',
                                borderColor: selectedIds.includes(p.id)
                                  ? 'var(--color-brave-orange)'
                                  : 'var(--color-heart-of-ice)',
                                borderWidth: '2px',
                              }}
                            >
                              <Checkbox
                                value={p.id}
                                size="sm"
                                label={
                                  <div>
                                    <div className="font-display text-[13px] truncate">
                                      {p.name}
                                    </div>
                                    <Group gap="xs" align="center" wrap="nowrap">
                                      <IconMapPin size={UI.iconSm} />
                                      <Text size={UI.textTiny} c="dimmed" className="font-body truncate">
                                        {[p.city, p.province].filter(Boolean).join(' · ')}
                                      </Text>
                                    </Group>
                                  </div>
                                }
                                color="orange"
                              />
                            </Paper>
                          ))}
                        </div>
                      </ScrollArea.Autosize>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {pool.map((p) => (
                          <Paper key={p.id} p="sm" radius="lg" withBorder style={{ backgroundColor: 'white', borderWidth: '2px' }}>
                            <Checkbox
                              value={p.id}
                              size="sm"
                              label={
                                <div>
                                  <Text fw={300} className="font-display text-[13px]" mb={4}>
                                    {p.name}
                                  </Text>
                                  <div className="flex items-center gap-2">
                                    <IconMapPin size={UI.iconSm} />
                                    <Text size={UI.textTiny} c="dimmed" className="font-body mt-[2px]">
                                      {[p.city, p.province].filter(Boolean).join(', ')}
                                    </Text>
                                  </div>
                                </div>
                              }
                            />
                          </Paper>
                        ))}
                      </div>
                    )}
                  </Checkbox.Group>
                </Paper>

                <Divider color="var(--color-heart-of-ice)" size="sm" />

                <div>
                  <Group mb="md">
                    <Paper p="xs" radius="lg" style={{ backgroundColor: 'var(--color-heart-of-ice)' }}>
                      <IconSettings size={UI.iconLg} style={{ color: 'var(--color-ocean-depths)' }} />
                    </Paper>
                    <div>
                      <Title order={4} className="font-display" style={{ color: 'var(--color-midnight-dreams)' }}>
                        Route Preferences
                      </Title>
                      <Text size={UI.textSm} c="dimmed" className="font-body">
                        Customize your travel parameters
                      </Text>
                    </div>
                  </Group>

                  <div className="grid md:grid-cols-2 gap-5 min-h-[110px]">
                    <Paper p="md" radius="lg" style={{ backgroundColor: 'var(--color-lynx-white)' }}>
                      <Group gap="xs" mb="sm">
                        <IconArrowsMove size={UI.iconMd} style={{ color: 'var(--color-brave-orange)' }} />
                        <Text fw={600} className="font-display">
                          Corridor Radius: {corridorRadius} km
                        </Text>
                      </Group>
                      <Slider
                        value={corridorRadius}
                        onChange={setCorridorRadius}
                        min={20}
                        max={250}
                        step={5}
                        size="sm"
                        color="var(--color-brave-orange)"
                        marks={isMobile ? [] : [
                          { value: 50, label: '50' },
                          { value: 100, label: '100' },
                          { value: 150, label: '150' },
                          { value: 200, label: '200' },
                        ]}
                      />
                    </Paper>

                    <Paper p="md" radius="md" style={{ backgroundColor: 'var(--color-lynx-white)' }}>
                      <Group justify="space-between" mb="sm">
                        <Text fw={600} className="font-display">
                          Province Attractions
                        </Text>
                        <Switch
                          checked={includeAttractions}
                          onChange={(e) => setIncludeAttractions(e.currentTarget.checked)}
                          color="orange"
                          size="sm"
                        />
                      </Group>

                      {includeAttractions && (
                        <Stack gap="sm" mt="sm">
                          <NumberInput
                            label="Attractions radius (km)"
                            value={fillRadius}
                            onChange={(v) => setFillRadius(Number(v || 0))}
                            min={10}
                            max={150}
                            size="sm"
                            radius="md"
                            styles={{
                              input: {
                                borderColor: 'var(--color-heart-of-ice)',
                                '&:focus': { borderColor: 'var(--color-brave-orange)' },
                              },
                            }}
                          />
                          <NumberInput
                            label="Top fill per city"
                            value={topFillPerCity}
                            onChange={(v) => setTopFillPerCity(Number(v || 0))}
                            min={1}
                            max={20}
                            size="sm"
                            radius="md"
                            styles={{
                              input: {
                                borderColor: 'var(--color-heart-of-ice)',
                                '&:focus': { borderColor: 'var(--color-brave-orange)' },
                              },
                            }}
                          />
                        </Stack>
                      )}
                    </Paper>
                  </div>
                </div>

                <Group justify="flex-end" mt="sm">
                  <Button
                    size="sm"
                    radius="md"
                    loading={submitting}
                    disabled={!canSubmit}
                    onClick={submit}
                    leftSection={<IconSparkles size={UI.iconLg - 2} />}
                    color="white"
                    variant="outline"
                    className="font-display"
                    style={{
                      background: 'linear-gradient(135deg, var(--color-brave-orange), var(--color-hot-embers))',
                      border: 'none',
                    }}
                  >
                    Generate Perfect Plan
                  </Button>
                </Group>
              </Stack>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-6">
              <Card
                padding="lg"
                radius="md"
                withBorder
                style={{ backgroundColor: 'white', borderColor: 'var(--color-heart-of-ice)', borderWidth: '2px' }}
              >
                <Stack gap="md">
                  <Group gap="sm">
                    <Paper p="xs" radius="md" style={{ backgroundColor: 'var(--color-desert-lilly)' }}>
                      <IconClock size={UI.iconLg} style={{ color: 'var(--color-brave-orange)' }} />
                    </Paper>
                    <div>
                      <Title order={5} className="font-display" style={{ color: 'var(--color-midnight-dreams)' }}>
                        Trip Summary
                      </Title>
                      <Text size={UI.textSm} c="dimmed" className="font-body">
                        Overview of your plan
                      </Text>
                    </div>
                  </Group>

                  <Divider color="var(--color-heart-of-ice)" />

                  <Stack gap="sm">
                    {[
                      { label: 'Selected places', value: selectedPool.length, color: 'blue', icon: IconMapPin },
                      { label: 'Start', value: useCurrent ? (resolvedCity || 'Auto (nearest)') : (startCity || 'Not set'), color: 'green', icon: IconGps },
                      { label: 'End', value: endCity || 'Not set', color: 'grape', icon: IconBuilding },
                      { label: 'Corridor radius', value: `${corridorRadius} km`, color: 'cyan', icon: IconArrowsMove },
                      { label: 'Province attractions', value: includeAttractions ? `Included (${fillRadius} km)` : 'Excluded', color: includeAttractions ? 'orange' : 'gray', icon: IconSparkles },
                    ].map((item, index) => (
                      <Paper key={index} p="sm" radius="md" style={{ backgroundColor: 'var(--color-lynx-white)' }}>
                        <Group justify="space-between" align="flex-start" wrap="nowrap">
                          <Group gap="xs" wrap="nowrap">
                            <item.icon size={UI.iconMd - 2} style={{ color: 'var(--color-welded-iron)' }} />
                            <Text size={UI.textSm} c="dimmed" className="font-body">
                              {item.label}
                            </Text>
                          </Group>
                          <Badge size="sm" radius="md" variant="filled" color={item.color} className="font-body">
                            {item.value}
                          </Badge>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                </Stack>
              </Card>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
