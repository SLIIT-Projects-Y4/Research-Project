import React, {useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {toast} from 'react-toastify';
import {
    Autocomplete, Badge, Button, Card, Checkbox, Container, Divider, Flex, Group,
    Loader, NumberInput, Paper, ScrollArea, Slider, Stack, Switch, Text, Title, rem
} from '@mantine/core';
import {api} from '@/api/client';
import {getPlanPool} from '@/api/planpool';
import {
    IconArrowsMove, IconBuilding, IconChevronDown, IconClock, IconCurrentLocation, IconGps,
    IconMapPin, IconNavigation, IconSettings, IconSparkles, IconRoute, IconTarget
} from '@tabler/icons-react';

function ItineraryPreview({data}) {
    if (!data) return null;
    const {itinerary = [], total_distance_km} = data;

    return (
      <Paper
        shadow="lg"
        p="xl"
        radius="xl"
        className="mt-8 border-2 border-heart-of-ice"
        style={{backgroundColor: 'var(--color-heart-of-ice)'}}
      >
          <Group justify="space-between" mb="lg">
              <Group gap="sm">
                  <IconRoute size={24} style={{color: 'var(--color-brave-orange)'}}/>
                  <Title order={3} className="font-display" style={{color: 'var(--color-midnight-dreams)'}}>
                      Plan Preview
                  </Title>
              </Group>
              <Badge
                size="xl"
                variant="filled"
                color="orange"
                leftSection={<IconTarget size={16}/>}
              >
                  Total: {total_distance_km?.toFixed?.(1) ?? total_distance_km} km
              </Badge>
          </Group>
          <Divider my="md" color="var(--color-welded-iron)" opacity={0.3}/>
          <Stack gap="md">
              {itinerary.map((s, i) => (
                <Paper
                  key={`${s.location_id ?? s.name}-${i}`}
                  p="lg"
                  radius="lg"
                  withBorder
                  className="hover:shadow-md transition-all duration-200"
                  style={{
                      backgroundColor: 'white',
                      borderColor: 'var(--color-heart-of-ice)'
                  }}
                >
                    <Group justify="space-between" align="flex-start">
                        <div className="flex-1">
                            <Group gap="xs" mb="xs">
                                <Text
                                  fw={600}
                                  size="lg"
                                  className="font-display"
                                  style={{color: 'var(--color-midnight-dreams)'}}
                                >
                                    {i + 1}. {s.name}
                                </Text>
                                {s.type ? (
                                  <Badge size="sm" variant="light" color="blue">{s.type}</Badge>
                                ) : s.is_city ? (
                                  <Badge size="sm" variant="light" color="gray">City</Badge>
                                ) : null}
                            </Group>
                            <Text size="sm" c="dimmed" className="font-body">
                                <IconMapPin size={14} style={{display: 'inline', marginRight: 4}}/>
                                {[s.city, s.province].filter(Boolean).join(' · ')}
                            </Text>
                        </div>
                        <div>
                            {i === 0 ? (
                              <Badge variant="filled" color="green" size="lg">Start</Badge>
                            ) : i === itinerary.length - 1 ? (
                              <Badge variant="filled" color="blue" size="lg">End</Badge>
                            ) : (
                              <Badge variant="outline" color="gray" size="lg">
                                  {s.distance_from_prev?.toFixed?.(1) ?? s.distance_from_prev} km
                              </Badge>
                            )}
                        </div>
                    </Group>
                </Paper>
              ))}
          </Stack>
      </Paper>
    );
}

function CityAutocomplete({
                              label,
                              value,
                              onChange,
                              cities,
                              disabled,
                              icon: Icon,
                              placeholder,
                              description,
                              rightSection
                          }) {
    return (
      <Stack gap="xs">
          <Group gap="xs" mb={2}>
              {Icon && <Icon size={20} style={{color: 'var(--color-brave-orange)'}}/>}
              <Text size="sm" fw={600} className="font-display" style={{color: 'var(--color-midnight-dreams)'}}>
                  {label}
              </Text>
          </Group>
          {description && (
            <Text size="xs" c="dimmed" mb={8} className="font-body">
                {description}
            </Text>
          )}
          <div className="relative">
              <Autocomplete
                data={cities}
                value={value}
                onChange={onChange}
                placeholder={placeholder || 'Select a city'}
                disabled={disabled}
                radius="md"
                size="lg"
                rightSection={rightSection}
                styles={{
                    input: {
                        backgroundColor: disabled ? 'var(--color-lynx-white)' : 'white',
                        border: '2px solid var(--color-heart-of-ice)',
                        transition: 'all 0.2s ease',
                        '&:focus': {
                            borderColor: 'var(--color-brave-orange)',
                        },
                        '&:hover': {
                            borderColor: 'var(--color-ocean-depths)',
                        }
                    },
                    dropdown: {
                        border: '2px solid var(--color-heart-of-ice)',
                    }
                }}
              />
          </div>
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
    const [geo, setGeo] = useState({lat: null, lng: null, ready: false});
    const [resolvedCity, setResolvedCity] = useState('');

    // prefs
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
                const {data} = await api.get('/api/locations/cities');
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

    // geolocation + resolve city
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
              setGeo({lat, lng, ready: true});

              try {
                  const {data} = await api.get('/api/locations/nearest-city', {params: {lat, lng}});
                  const city = data?.data?.city || '';
                  setResolvedCity(city);
              } catch {
                  setResolvedCity('');
              }

              toast.success('Got current location');
          },
          (err) => {
              console.error(err);
              toast.error('Failed to get current location');
              setUseCurrent(false);
          },
          {enableHighAccuracy: true, timeout: 8000, maximumAge: 0}
        );
    };

    useEffect(() => {
        if (useCurrent) {
            setStartCity('');
            setResolvedCity('');
            requestGeolocation();
        } else {
            setGeo({lat: null, lng: null, ready: false});
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
        const plan_pool = Array.from(new Set(selectedPool.map((p) => p.name))).filter(Boolean);
        const base = {
            end_city: endCity,
            plan_pool,
            include_city_attractions: includeAttractions,
            city_attraction_radius_km: includeAttractions ? Number(fillRadius) : null,
            corridor_radius_km: Number(corridorRadius),
            top_fill_per_city: Number(topFillPerCity),
        };
        if (useCurrent) {
            return {...base, use_current_location: true, start_lat: Number(geo.lat), start_lng: Number(geo.lng)};
        }
        return {...base, start_city: startCity};
    };

    const submit = async () => {
        if (!canSubmit) {
            toast.info('Please complete the required fields');
            return;
        }
        try {
            setSubmitting(true);
            const payload = buildPayload();
            const {data} = await api.post('/api/plan/generate', payload);
            const out = data?.data ?? data;
            if (out?.status === 'ok') {
                sessionStorage.setItem('lastPlan', JSON.stringify(out));
                toast.success('Plan generated');
                navigate('/plan/itinerary', {state: out});
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
      <div className="min-h-screen">
          <Container size="lg" py={rem(80)}>
              {/* Hero Section */}
              <div className="text-left mt-8 mb-12">
                  <h1
                    className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
                      Generate Plan
                  </h1>
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                  {/* Main Form */}
                  <div className="lg:col-span-2">
                      <Card
                        padding="xl"
                        radius="xl"
                        withBorder
                        style={{
                            backgroundColor: 'white',
                            borderColor: 'var(--color-heart-of-ice)',
                            borderWidth: '2px'
                        }}
                      >
                          <Stack gap="xl">
                              {/* Journey Points */}
                              <div>
                                  <Group mb="lg">
                                      <Paper
                                        p="sm"
                                        radius="lg"
                                        style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                                      >
                                          <IconNavigation size={24} style={{color: 'var(--color-midnight-dreams)'}}/>
                                      </Paper>
                                      <div>
                                          <Title order={3} className="font-display"
                                                 style={{color: 'var(--color-midnight-dreams)'}}>
                                              Journey Points
                                          </Title>
                                          <Text size="sm" c="dimmed" className="font-body">
                                              Select your starting point and destination
                                          </Text>
                                      </div>
                                  </Group>

                                  <Stack gap="lg">
                                      <CityAutocomplete
                                        label="Start City"
                                        value={useCurrent ? (resolvedCity || '') : startCity}
                                        onChange={setStartCity}
                                        cities={cities}
                                        disabled={useCurrent || loadingCities}
                                        icon={IconGps}
                                        placeholder={
                                            useCurrent
                                              ? (resolvedCity ? 'Resolved from location' : 'Nearest City Selected')
                                              : (loadingCities ? 'Loading cities…' : 'Choose start city')
                                        }
                                        rightSection={useCurrent ? (
                                          <Badge
                                            size="sm"
                                            radius="sm"
                                            variant="filled"
                                            color={resolvedCity ? 'teal' : 'gray'}
                                          >
                                              {resolvedCity ? 'GPS' : 'Auto'}
                                          </Badge>
                                        ) : <IconChevronDown size={16}/>}
                                      />

                                      <Paper
                                        p="xs"
                                        radius="md"
                                        style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                                      >
                                          <Group gap="md">
                                              <Switch
                                                checked={useCurrent}
                                                onChange={(e) => setUseCurrent(e.currentTarget.checked)}
                                                size="md"
                                                color="orange"
                                              />
                                              <div className="flex-1">
                                                  <Text fw={500} className="font-display">
                                                      Use my current location
                                                  </Text>
                                                  <Text size="sm" c="dimmed" className="font-body">
                                                      Automatically snap to nearest city
                                                  </Text>
                                              </div>
                                              {useCurrent && (
                                                <Badge
                                                  leftSection={<IconCurrentLocation size={12}/>}
                                                  color={geo.ready ? 'teal' : 'orange'}
                                                  variant="filled"
                                                  size="lg"
                                                  radius="md"
                                                >
                                                    {geo.ready
                                                      ? `${geo.lat?.toFixed?.(4)}, ${geo.lng?.toFixed?.(4)}`
                                                      : 'Locating…'
                                                    }
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
                                        rightSection={<IconChevronDown size={16}/>}
                                      />
                                  </Stack>
                              </div>

                              <Divider color="var(--color-heart-of-ice)" size="md"/>

                              {/* Saved Places */}
                              <div>
                                  <Group mb="lg">
                                      <Paper
                                        p="sm"
                                        radius="lg"
                                        style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                                      >
                                          <IconMapPin size={24} style={{color: 'var(--color-midnight-dreams)'}}/>
                                      </Paper>
                                      <div>
                                          <Title order={3} className="font-display"
                                                 style={{color: 'var(--color-midnight-dreams)'}}>
                                              Saved Places
                                          </Title>
                                          <Text size="sm" c="dimmed" className="font-body">
                                              Select which places to include in your route
                                          </Text>
                                      </div>
                                  </Group>

                                  {loadingPool ? (
                                    <Group gap="sm" justify="center" py="xl">
                                        <Loader size="lg" color="orange"/>
                                        <Text c="dimmed" className="font-body">Loading your saved places…</Text>
                                    </Group>
                                  ) : pool.length === 0 ? (
                                    <Paper
                                      p="xl"
                                      radius="lg"
                                      style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                                      ta="center"
                                    >
                                        <Text c="dimmed" className="font-body">
                                            Your plan pool is empty. Add locations from the recommendations page.
                                        </Text>
                                    </Paper>
                                  ) : (
                                    <Stack gap="md">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Badge size="lg" variant="filled" color="var(--color-ocean-depths)" radius={"md"}>
                                                    {selectedIds.length} selected
                                                </Badge>
                                                <Text size="sm" c="dimmed" className="font-body">
                                                    of {pool.length} total places
                                                </Text>
                                            </Group>
                                            <Group gap="xs">
                                                <Button
                                                  size="sm"
                                                  variant="light"
                                                  color="var(--color-ocean-depths)"
                                                  onClick={() => toggleAll(true)}
                                                >
                                                    Select all
                                                </Button>
                                                <Button
                                                  size="sm"
                                                  variant="light"
                                                  color="gray"
                                                  onClick={() => toggleAll(false)}
                                                >
                                                    Clear
                                                </Button>
                                            </Group>
                                        </Group>

                                        <Paper
                                          p="md"
                                          radius="md"
                                          withBorder
                                          style={{
                                              backgroundColor: 'var(--color-lynx-white)',
                                              borderColor: 'var(--color-heart-of-ice)'
                                          }}
                                        >
                                            <Checkbox.Group value={selectedIds} onChange={setSelectedIds}>
                                                {pool.length > 10 ? (
                                                  // Horizontal scroller for more than 10 items
                                                  <ScrollArea.Autosize
                                                    mah={300}
                                                    mx="auto"
                                                    scrollbars="xy"
                                                  >
                                                      <Flex gap="md" wrap="nowrap" style={{minWidth: 'max-content'}}>
                                                          {pool.map((p) => (
                                                            <Paper
                                                              key={p.id}
                                                              p="md"
                                                              radius="md"
                                                              withBorder
                                                              style={{
                                                                  minWidth: rem(280),
                                                                  backgroundColor: 'white',
                                                                  borderColor: selectedIds.includes(p.id)
                                                                    ? 'var(--color-brave-orange)'
                                                                    : 'var(--color-heart-of-ice)',
                                                                  borderWidth: '2px'
                                                              }}
                                                            >
                                                                <Checkbox
                                                                  value={p.id}
                                                                  label={
                                                                      <div>
                                                                          <div className="font-display text-sm">
                                                                              {p.name}
                                                                          </div>
                                                                          <Group gap="xs">
                                                                              <IconMapPin size={14}/>
                                                                              <Text size="sm" c="dimmed"
                                                                                    className="font-body">
                                                                                  {[p.city, p.province].filter(Boolean).join(' · ')}
                                                                              </Text>
                                                                          </Group>
                                                                      </div>
                                                                  }
                                                                  color="orange"
                                                                  size="lg"
                                                                />
                                                            </Paper>
                                                          ))}
                                                      </Flex>
                                                  </ScrollArea.Autosize>
                                                ) : (
                                                  // Regular grid for 10 or fewer items
                                                  <div className="grid sm:grid-cols-2 gap-4">
                                                      {pool.map((p) => (
                                                        <Paper
                                                          key={p.id}
                                                          p="md"
                                                          radius="lg"
                                                          withBorder
                                                          style={{
                                                              backgroundColor: 'white',
                                                              borderWidth: '2px'
                                                          }}
                                                        >
                                                            <Checkbox
                                                              value={p.id}
                                                              label={
                                                                  <div>
                                                                      <Text fw={300} className="font-display text-sm" size={'sm'} mb={4}>
                                                                          {p.name}
                                                                      </Text>
                                                                      <div className={`flex items-center gap-2`}>
                                                                          <IconMapPin size={14}/>
                                                                          <Text size="xs" c="dimmed"
                                                                                className="font-body mt-1">
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
                                    </Stack>
                                  )}
                              </div>

                              <Divider color="var(--color-heart-of-ice)" size="md"/>

                              {/* Preferences */}
                              <div>
                                  <Group mb="lg">
                                      <Paper
                                        p="sm"
                                        radius="lg"
                                        style={{backgroundColor: 'var(--color-heart-of-ice)'}}
                                      >
                                          <IconSettings size={24} style={{color: 'var(--color-ocean-depths)'}}/>
                                      </Paper>
                                      <div>
                                          <Title order={3} className="font-display"
                                                 style={{color: 'var(--color-midnight-dreams)'}}>
                                              Route Preferences
                                          </Title>
                                          <Text size="sm" c="dimmed" className="font-body">
                                              Customize your travel parameters
                                          </Text>
                                      </div>
                                  </Group>

                                  <div className="grid md:grid-cols-2 gap-6 min-h-[130px]">
                                      <Paper
                                        p="lg"
                                        radius="lg"
                                        style={{backgroundColor: 'var(--color-lynx-white)'}}
                                      >
                                          <Group gap="xs" mb="md">
                                              <IconArrowsMove size={18} style={{color: 'var(--color-brave-orange)'}}/>
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
                                            color="var(--color-brave-orange)"
                                            size="md"
                                            marks={[
                                                {value: 50, label: '50'},
                                                {value: 100, label: '100'},
                                                {value: 150, label: '150'},
                                                {value: 200, label: '200'}
                                            ]}
                                          />
                                      </Paper>

                                      <Paper
                                        p="md"
                                        radius="md"
                                        style={{backgroundColor: 'var(--color-lynx-white)'}}
                                      >
                                          <Group justify="space-between" mb="md">
                                              <Text fw={600} className="font-display">
                                                  Province Attractions
                                              </Text>
                                              <Switch
                                                checked={includeAttractions}
                                                onChange={(e) => setIncludeAttractions(e.currentTarget.checked)}
                                                color="orange"
                                                size="md"
                                              />
                                          </Group>

                                          {includeAttractions && (
                                            <Stack gap="md" mt="md">
                                                <NumberInput
                                                  label="Attractions radius (km)"
                                                  value={fillRadius}
                                                  onChange={(v) => setFillRadius(Number(v || 0))}
                                                  min={10}
                                                  max={150}
                                                  size="md"
                                                  radius="md"
                                                  styles={{
                                                      input: {
                                                          borderColor: 'var(--color-heart-of-ice)',
                                                          '&:focus': {
                                                              borderColor: 'var(--color-brave-orange)',
                                                          }
                                                      }
                                                  }}
                                                />
                                                <NumberInput
                                                  label="Top fill per city"
                                                  value={topFillPerCity}
                                                  onChange={(v) => setTopFillPerCity(Number(v || 0))}
                                                  min={1}
                                                  max={20}
                                                  size="md"
                                                  radius="md"
                                                  styles={{
                                                      input: {
                                                          borderColor: 'var(--color-heart-of-ice)',
                                                          '&:focus': {
                                                              borderColor: 'var(--color-brave-orange)',
                                                          }
                                                      }
                                                  }}
                                                />
                                            </Stack>
                                          )}
                                      </Paper>
                                  </div>
                              </div>

                              <Group justify="flex-end" mt="md">
                                  <Button
                                    size="md"
                                    radius="md"
                                    loading={submitting}
                                    disabled={!canSubmit}
                                    onClick={submit}
                                    leftSection={<IconSparkles size={20}/>}
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

                  {/* Summary Sidebar */}
                  <div className="lg:col-span-1">
                      <div className="sticky top-8">
                          <Card
                            padding="xl"
                            radius="md"
                            withBorder
                            style={{
                                backgroundColor: 'white',
                                borderColor: 'var(--color-heart-of-ice)',
                                borderWidth: '2px'
                            }}
                          >
                              <Stack gap="lg">
                                  <Group gap="sm">
                                      <Paper
                                        p="sm"
                                        radius="md"
                                        style={{backgroundColor: 'var(--color-desert-lilly)'}}
                                      >
                                          <IconClock size={24} style={{color: 'var(--color-brave-orange)'}}/>
                                      </Paper>
                                      <div>
                                          <Title order={4} className="font-display"
                                                 style={{color: 'var(--color-midnight-dreams)'}}>
                                              Trip Summary
                                          </Title>
                                          <Text size="sm" c="dimmed" className="font-body">
                                              Overview of your plan
                                          </Text>
                                      </div>
                                  </Group>

                                  <Divider color="var(--color-heart-of-ice)"/>

                                  <Stack gap="md">
                                      {[
                                          {
                                              label: 'Selected places',
                                              value: selectedPool.length,
                                              color: 'blue',
                                              icon: IconMapPin
                                          },
                                          {
                                              label: 'Start',
                                              value: useCurrent ? (resolvedCity || 'Auto (nearest)') : (startCity || 'Not set'),
                                              color: 'green',
                                              icon: IconGps
                                          },
                                          {
                                              label: 'End',
                                              value: endCity || 'Not set',
                                              color: 'grape',
                                              icon: IconBuilding
                                          },
                                          {
                                              label: 'Corridor radius',
                                              value: `${corridorRadius} km`,
                                              color: 'cyan',
                                              icon: IconArrowsMove
                                          },
                                          {
                                              label: 'Province attractions',
                                              value: includeAttractions ? `Included (${fillRadius} km)` : 'Excluded',
                                              color: includeAttractions ? 'orange' : 'gray',
                                              icon: IconSparkles
                                          }
                                      ].map((item, index) => (
                                        <Paper
                                          key={index}
                                          p="md"
                                          radius="md"
                                          style={{backgroundColor: 'var(--color-lynx-white)'}}
                                        >
                                            <Group justify="space-between" align="flex-start">
                                                <Group gap="xs">
                                                    <item.icon size={16} style={{color: 'var(--color-welded-iron)'}}/>
                                                    <Text size="sm" c="dimmed" className="font-body">
                                                        {item.label}
                                                    </Text>
                                                </Group>
                                                <Badge
                                                  size="md"
                                                  radius="md"
                                                  variant="filled"
                                                  color={item.color}
                                                  className="font-body"
                                                >
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