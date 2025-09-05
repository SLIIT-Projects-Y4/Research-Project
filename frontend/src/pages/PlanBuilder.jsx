// src/pages/PlanBuilder.jsx
import React, {useEffect, useMemo, useState} from 'react';
import {
    Button,
    Combobox,
    InputBase,
    NumberInput,
    Paper,
    Switch,
    Text,
    useCombobox,
} from '@mantine/core';
import {toast} from 'react-toastify';
import {getPlanPool} from '../api/planpool';
import {generatePlan} from '../api/planner';
import {useNavigate} from "react-router-dom";

function CityPicker({label, value, onChange, cities, disabled}) {
    const [search, setSearch] = useState('');
    const combobox = useCombobox();
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return cities;
        return cities.filter((c) => c.toLowerCase().includes(q));
    }, [search, cities]);


    return (
      <div className="space-y-1">
          <label className="text-sm text-gray-700">{label}</label>
          <Combobox
            store={combobox}
            onOptionSubmit={(val) => {
                onChange(val);
                setSearch('');
                combobox.closeDropdown();
            }}
            withinPortal={false}
          >
              <Combobox.Target>
                  <InputBase
                    component="button"
                    type="button"
                    disabled={disabled}
                    onClick={() => combobox.openDropdown()}
                    rightSection={<Combobox.Chevron/>}
                    rightSectionPointerEvents="none"
                    className="w-full"
                  >
                      {value || <span className="text-gray-500">Select a city</span>}
                  </InputBase>
              </Combobox.Target>

              <Combobox.Dropdown>
                  <Combobox.Search
                    value={search}
                    onChange={(e) => setSearch(e.currentTarget.value)}
                    placeholder="Search cities…"
                  />
                  <Combobox.Options>
                      {filtered.length === 0 ? (
                        <Combobox.Empty>Nothing found</Combobox.Empty>
                      ) : (
                        filtered.map((city) => (
                          <Combobox.Option value={city} key={city}>
                              {city}
                          </Combobox.Option>
                        ))
                      )}
                  </Combobox.Options>
              </Combobox.Dropdown>
          </Combobox>
      </div>
    );
}

export default function PlanBuilder() {
    const [loading, setLoading] = useState(true);
    const [pool, setPool] = useState([]);
    const [cities, setCities] = useState([]);

    const navigate = useNavigate();


    // start
    const [useStartCoords, setUseStartCoords] = useState(false);
    const [startCity, setStartCity] = useState('');
    const [startCoords, setStartCoords] = useState(null);

    // end (city only; ML does not accept end_lat/lng)
    const [endCity, setEndCity] = useState('');

    // options
    const [includeCityAttractions, setIncludeCityAttractions] = useState(false);
    const [minAttractions, setMinAttractions] = useState(3);
    const [corridorRadiusKm, setCorridorRadiusKm] = useState(100);

    // Load plan pool and deduce city list
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const poolRes = await getPlanPool(); // { status, data: [...] }
                const items = Array.isArray(poolRes?.data) ? poolRes.data : [];
                setPool(items);

                const uniqueCities = Array.from(new Set(items.map((i) => i.city).filter(Boolean))).sort(
                  (a, b) => a.localeCompare(b)
                );
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
                  setStartCity(''); // clear city if using coords
                  toast.success('Current location captured');
                  resolve();
              },
              (err) => {
                  toast.error(err?.message || 'Unable to get current location');
                  resolve();
              },
              {enableHighAccuracy: true, timeout: 10000}
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
            toast.error('Enter a valid corridor radius (km)');
            return false;
        }
        return true;
    };

    const onGenerate = async () => {
        if (!validate()) return;

        // ML expects plan_pool as an array of location names (strings)
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
              ? {start_lat: startCoords.lat, start_lng: startCoords.lng}
              : {}),
        };

        try {
            const res = await generatePlan(body);
            if (res?.status === 'ok') {
                // persist for reloads and deep-linking
                sessionStorage.setItem('lastPlan', JSON.stringify(res));
                toast.success('Plan generated!');
                // jump to viewer with state
                navigate('/plan/itinerary', {state: res});
            } else {
                toast.error('Planner returned an unexpected response');
            }
        } catch (err) {
            const msg =
              err?.response?.data?.error ||
              err?.response?.data?.detail ||
              err?.message ||
              'Failed to generate plan';
            toast.error(msg);
        }
    };

    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-6">
              <div className="flex items-end justify-between">
                  <h1 className="text-2xl font-semibold">Build your plan</h1>
              </div>

              <Paper shadow="sm" p="lg" className="space-y-6">
                  {loading ? (
                    <div className="text-gray-600">Loading…</div>
                  ) : (
                    <>
                        {/* Start */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-2">
                                <CityPicker
                                  label="Start city"
                                  value={useStartCoords ? '' : startCity}
                                  onChange={setStartCity}
                                  cities={cities}
                                  disabled={useStartCoords}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                  variant={useStartCoords ? 'filled' : 'default'}
                                  onClick={() =>
                                    useStartCoords
                                      ? (setUseStartCoords(false), setStartCoords(null))
                                      : tryGetStartLocation()
                                  }
                                >
                                    {useStartCoords ? 'Using current location' : 'Use current location'}
                                </Button>
                                {useStartCoords && startCoords && (
                                  <Text size="sm" className="text-gray-600">
                                      ({startCoords.lat}, {startCoords.lng})
                                  </Text>
                                )}
                            </div>
                        </div>

                        {/* End */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-2">
                                <CityPicker
                                  label="End city"
                                  value={endCity}
                                  onChange={setEndCity}
                                  cities={cities}
                                  disabled={false}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Text size="sm" className="text-gray-600">
                                    End location uses city only (per API)
                                </Text>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div className="md:col-span-1">
                                <NumberInput
                                  label="Corridor radius (km)"
                                  value={corridorRadiusKm}
                                  onChange={setCorridorRadiusKm}
                                  min={1}
                                  max={300}
                                  clampBehavior="strict"
                                  placeholder="e.g., 100"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <NumberInput
                                  label="Min attractions"
                                  value={minAttractions}
                                  onChange={setMinAttractions}
                                  min={0}
                                  max={20}
                                  clampBehavior="strict"
                                />
                            </div>
                            <div className="md:col-span-1">
                                <Switch
                                  label="Include city attractions"
                                  checked={includeCityAttractions}
                                  onChange={(e) => setIncludeCityAttractions(e.currentTarget.checked)}
                                />
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end">
                            <Button onClick={onGenerate}>Generate Plan</Button>
                        </div>
                    </>
                  )}
              </Paper>
          </div>
      </div>
    );
}
