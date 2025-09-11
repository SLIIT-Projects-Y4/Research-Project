import React, { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Combobox,
    InputBase,
    NumberInput,
    Paper,
    Switch,
    Text,
    useCombobox,
    Group,
    Stack,
    Card,
    Badge,
    Divider,
    ActionIcon,
    Tooltip,
    rem,
    LoadingOverlay,
} from '@mantine/core';
import { toast } from 'react-toastify';
import { getPlanPool } from '../api/planpool';
import { generatePlan } from '../api/planner';
import { useNavigate } from "react-router-dom";
import {
    IconMapPin,
    IconNavigation,
    IconSparkles,
    IconRoute,
    IconClock,
    IconTarget,
    IconChevronDown,
    IconCurrentLocation,
    IconWorld,
    IconGps,
    IconArrowsMove,
    IconBuilding,
    IconSettings,
} from '@tabler/icons-react';
import { AnimatePresence, motion } from 'framer-motion';

// Shared component for the combo box
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
                <Text size="sm" fw={600} c="var(--color-midnight-dreams)">
                    {label}
                </Text>
            </Group>
            {description && (
                <Text size="xs" c="dimmed" mb={4}>
                    {description}
                </Text>
            )}
            <Combobox
                store={combobox}
                onOptionSubmit={(val) => {
                    onChange(val);
                    setSearch('');
                    combobox.closeDropdown();
                }}
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
                                height: rem(48),
                                padding: '0 1rem',
                                '&:hover': {
                                    borderColor: 'var(--color-brave-orange)',
                                },
                                '&:focus-within': {
                                    borderColor: 'var(--color-brave-orange)',
                                    boxShadow: '0 0 0 1px var(--color-brave-orange)',
                                },
                                '&[data-disabled]': {
                                    backgroundColor: 'var(--mantine-color-gray-1)',
                                    opacity: 0.7,
                                },
                            },
                        }}
                    >
                        {value ? (
                            <Text c="var(--color-midnight-dreams)" fw={500}>
                                {value}
                            </Text>
                        ) : (
                            <Text c="dimmed">
                                {placeholder || 'Select a city'}
                            </Text>
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

// Main Component
export default function PlanBuilder() {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [pool, setPool] = useState([]);
    const [cities, setCities] = useState([]);
    const navigate = useNavigate();

    // Form state
    const [useStartCoords, setUseStartCoords] = useState(false);
    const [startCity, setStartCity] = useState('');
    const [startCoords, setStartCoords] = useState(null);
    const [endCity, setEndCity] = useState('');
    const [includeCityAttractions, setIncludeCityAttractions] = useState(false);
    const [minAttractions, setMinAttractions] = useState(3);
    const [corridorRadiusKm, setCorridorRadiusKm] = useState(100);

    // Load plan pool
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const poolRes = await getPlanPool();
                const items = Array.isArray(poolRes?.data) ? poolRes.data : [];
                setPool(items);
                const uniqueCities = Array.from(
                    new Set(items.map((i) => i.city).filter(Boolean))
                ).sort((a, b) => a.localeCompare(b));
                setCities(uniqueCities);
            } catch {
                toast.error('Failed to load plan pool');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
        if (useStartCoords && !startCoords) {
            toast.error('Start location not set');
            return false;
        }
        if (!useStartCoords && !startCity) {
            toast.error('Please select a start city');
            return false;
        }
        if (!endCity) {
            toast.error('Please select an end city');
            return false;
        }
        if (!(corridorRadiusKm > 0)) {
            toast.error('Enter a valid corridor radius');
            return false;
        }
        return true;
    };

    const onGenerate = async () => {
        if (!validate()) return;
        setGenerating(true);
        const planPoolNames = Array.from(
            new Set((pool || []).map((p) => p?.name).filter(Boolean))
        );

        const body = {
            start_city: useStartCoords ? null : startCity,
            end_city: endCity,
            plan_pool: planPoolNames,
            include_city_attractions: !!includeCityAttractions,
            min_attractions: Number(minAttractions),
            corridor_radius_km: Number(corridorRadiusKm),
            ...(useStartCoords && startCoords
                ? { start_lat: startCoords.lat, start_lng: startCoords.lng }
                : {}),
        };

        try {
            const res = await generatePlan(body);
            if (res?.status === 'ok') {
                sessionStorage.setItem('lastPlan', JSON.stringify(res));
                toast.success('Plan generated successfully!');
                navigate('/plan/itinerary', { state: res });
            } else {
                toast.error('Planner returned an unexpected response');
            }
        } catch (err) {
            const msg = err?.response?.data?.error ||
                err?.response?.data?.detail ||
                err?.message ||
                'Failed to generate plan';
            toast.error(msg);
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="min-h-screen py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
                <Stack gap="xl" mb="xl">
                    <Text size="3.5rem" fw={800} lh={1.1} className="font-display" c="var(--color-midnight-dreams)">
                        Craft Your <Text component="span" c="var(--color-brave-orange)" inherit>Perfect</Text> Trip
                    </Text>
                    <Text size="lg" c="dimmed" maw={700} lh={1.6}>
                        Select your start and end points, fine-tune your preferences, and let our powerful AI create an optimized itinerary just for you.
                    </Text>
                </Stack>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Form Inputs */}
                    <Card
                        shadow="xl"
                        padding="xl"
                        radius="lg"
                        withBorder
                        className="lg:col-span-2"
                        style={{ backgroundColor: 'var(--color-lynx-white)' }}
                    >
                        <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: 'sm', blur: 2 }} />
                        <Stack gap="xl">
                            <Stack gap="lg">
                                <Group>
                                    <IconNavigation size={28} c="var(--color-brave-orange)" />
                                    <Text size="xl" fw={700} c="var(--color-midnight-dreams)">
                                        Journey Points
                                    </Text>
                                </Group>
                                <Divider />
                                <CustomCombobox
                                    label="Start Location"
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
                                    label="End Location"
                                    value={endCity}
                                    onChange={setEndCity}
                                    cities={cities}
                                    icon={IconBuilding}
                                    placeholder="Choose your destination city"
                                    description="This will be the final stop on your journey."
                                />
                            </Stack>
                            <Divider />
                            <Stack gap="lg">
                                <Group>
                                    <IconSettings size={28} c="var(--color-brave-orange)" />
                                    <Text size="xl" fw={700} c="var(--color-midnight-dreams)">
                                        Route Preferences
                                    </Text>
                                </Group>
                                <Divider />
                                <div className="grid sm:grid-cols-2 gap-6">
                                    <Stack gap="xs">
                                        <Group gap="xs">
                                            <IconArrowsMove size={16} />
                                            <Text size="sm" fw={600} c="var(--color-midnight-dreams)">
                                                Search Radius (km)
                                            </Text>
                                        </Group>
                                        <NumberInput
                                            value={corridorRadiusKm}
                                            onChange={setCorridorRadiusKm}
                                            min={1}
                                            max={300}
                                            clampBehavior="strict"
                                            placeholder="e.g., 100"
                                            size="md"
                                            radius="md"
                                        />
                                        <Text size="xs" c="dimmed">
                                            How far to search for attractions along your route.
                                        </Text>
                                    </Stack>
                                    <Stack gap="xs">
                                        <Group gap="xs">
                                            <IconSparkles size={16} />
                                            <Text size="sm" fw={600} c="var(--color-midnight-dreams)">
                                                Minimum Attractions
                                            </Text>
                                        </Group>
                                        <NumberInput
                                            value={minAttractions}
                                            onChange={setMinAttractions}
                                            min={0}
                                            max={20}
                                            clampBehavior="strict"
                                            size="md"
                                            radius="md"
                                        />
                                        <Text size="xs" c="dimmed">
                                            Minimum number of points of interest to include.
                                        </Text>
                                    </Stack>
                                </div>
                                <Card padding="md" radius="md" withBorder>
                                    <Group justify="space-between">
                                        <Stack gap={2}>
                                            <Text size="sm" fw={600} c="var(--color-midnight-dreams)">
                                                Include City Attractions
                                            </Text>
                                            <Text size="xs" c="dimmed">
                                                Add popular city-specific sights to your itinerary.
                                            </Text>
                                        </Stack>
                                        <Switch
                                            checked={includeCityAttractions}
                                            onChange={(e) => setIncludeCityAttractions(e.currentTarget.checked)}
                                            size="lg"
                                            color="orange"
                                        />
                                    </Group>
                                </Card>
                            </Stack>
                        </Stack>
                    </Card>

                    {/* Summary & Generate Section */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8">
                            <Card
                                shadow="xl"
                                padding="xl"
                                radius="lg"
                                withBorder
                                style={{ backgroundColor: 'var(--color-lynx-white)' }}
                            >
                                <Stack gap="lg">
                                    <Group gap="xs">
                                        <IconClock size={24} c="var(--color-brave-orange)" />
                                        <Text size="lg" fw={700} c="var(--color-midnight-dreams)">
                                            Trip Summary
                                        </Text>
                                    </Group>
                                    <Divider />
                                    <Stack gap="xs">
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">Destinations in pool</Text>
                                            <Badge size="lg" variant="light" color="blue">
                                                {pool.length}
                                            </Badge>
                                        </Group>
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">Start Location</Text>
                                            <Badge size="lg" variant="light" color="blue">
                                                {useStartCoords ? 'Current Location' : startCity || 'Not set'}
                                            </Badge>
                                        </Group>
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">End Location</Text>
                                            <Badge size="lg" variant="light" color="grape">
                                                {endCity || 'Not set'}
                                            </Badge>
                                        </Group>
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">Search radius</Text>
                                            <Badge size="lg" variant="light" color="cyan">
                                                {corridorRadiusKm} km
                                            </Badge>
                                        </Group>
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">Min attractions</Text>
                                            <Badge size="lg" variant="light" color="pink">
                                                {minAttractions}
                                            </Badge>
                                        </Group>
                                        <Group justify="space-between" py="xs">
                                            <Text size="sm" c="dimmed">City attractions</Text>
                                            <Badge
                                                size="lg"
                                                variant="light"
                                                color={includeCityAttractions ? 'orange' : 'gray'}
                                            >
                                                {includeCityAttractions ? 'Included' : 'Excluded'}
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
                                        {generating ? 'Generating Your Plan...' : 'Generate Perfect Plan'}
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