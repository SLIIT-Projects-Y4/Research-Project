// src/pages/PlanDetails.jsx
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Badge, Button, Card, Container, Divider, Group, Image, Paper, SimpleGrid,
  Stack, Text, Title
} from '@mantine/core';
import { toast } from 'react-toastify';
import { Save, Eye, Route as RouteIcon, Flag, MapPin, Download } from 'lucide-react';

export default function PlanDetails() {
  const navigate = useNavigate();
  const location = useLocation();

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

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Text c="dimmed">No plan payload found. Please generate a plan first.</Text>
      </div>
    );
  }

  const { itinerary = [], total_distance_km, start, end, corridor_radius_km, province_corridor = [] } = payload;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <Container size="lg">
        <Group justify="space-between" align="flex-end" mb="lg">
          <div>
            <Title order={2}>Plan details</Title>
            <Text c="dimmed">Review your generated plan and continue to tweak the itinerary.</Text>
          </div>
          <Group gap="xs">
            <Button
              variant="light"
              leftSection={<Eye size={16} />}
              onClick={() => navigate('/plan/itinerary', { state: payload })}
            >
              Open Itinerary
            </Button>
            <Button
              variant="default"
              leftSection={<Download size={16} />}
              onClick={() => {
                try {
                  const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(file);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'plan.json';
                  a.click();
                  URL.revokeObjectURL(url);
                } catch {
                  toast.error('Export failed');
                }
              }}
            >
              Export
            </Button>
          </Group>
        </Group>

        <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
          <Card withBorder radius="lg" p="lg">
            <Group>
              <MapPin size={18} />
              <Text fw={700}>Start</Text>
            </Group>
            <Divider my="sm" />
            <Text>{start?.name || itinerary[0]?.name || '—'}</Text>
            <Badge mt="xs" variant="light">{start?.province || itinerary[0]?.province || '—'}</Badge>
          </Card>

          <Card withBorder radius="lg" p="lg">
            <Group>
              <Flag size={18} />
              <Text fw={700}>End</Text>
            </Group>
            <Divider my="sm" />
            <Text>{end?.name || itinerary[itinerary.length - 1]?.name || '—'}</Text>
            <Badge mt="xs" variant="light">{end?.province || itinerary[itinerary.length - 1]?.province || '—'}</Badge>
          </Card>

          <Card withBorder radius="lg" p="lg">
            <Group>
              <RouteIcon size={18} />
              <Text fw={700}>Overview</Text>
            </Group>
            <Divider my="sm" />
            <Group gap="xs" wrap="wrap">
              {typeof total_distance_km === 'number' && (
                <Badge variant="light" leftSection={<RouteIcon size={14} />}>
                  {total_distance_km.toFixed(1)} km
                </Badge>
              )}
              {corridor_radius_km && (
                <Badge variant="light">{corridor_radius_km} km corridor</Badge>
              )}
              <Badge variant="outline">{itinerary.length} stops</Badge>
            </Group>
          </Card>
        </SimpleGrid>

        {province_corridor.length > 0 && (
          <Paper withBorder radius="lg" p="lg" mt="lg">
            <Text fw={700} mb="xs">Province corridor</Text>
            <Group gap="xs" wrap="wrap">
              {province_corridor.map((p) => (
                <Badge key={p} variant="light">{p}</Badge>
              ))}
            </Group>
          </Paper>
        )}

        <Paper withBorder radius="lg" p="lg" mt="lg">
          <Text fw={700} mb="sm">Stops</Text>
          <Divider mb="md" />
          <Stack gap="sm">
            {itinerary.map((s, i) => (
              <Group key={`${s.name}-${i}`} justify="space-between" className="border border-gray-200 rounded-lg p-3">
                <Group gap="md">
                  <Image
                    src={s.image_url || '/assets/fallback.jpg'}
                    width={72}
                    height={72}
                    radius="md"
                    fit="cover"
                    alt={s.name}
                    withPlaceholder
                  />
                  <div>
                    <Text fw={600}>{i + 1}. {s.name}</Text>
                    <Text c="dimmed" size="sm">{[s.city, s.province].filter(Boolean).join(' · ')}</Text>
                  </div>
                </Group>
                <Group gap="xs">
                  {s.type && <Badge variant="light">{s.type}</Badge>}
                  {(i === 0 || i === itinerary.length - 1) && (
                    <Badge variant="outline" color="gray">{i === 0 ? 'Start' : 'End'}</Badge>
                  )}
                </Group>
              </Group>
            ))}
          </Stack>
        </Paper>

        <Group justify="flex-end" mt="xl">
          <Button variant="light" onClick={() => navigate(-1)}>Back</Button>
          <Button onClick={() => navigate('/plan/itinerary', { state: payload })}>Continue to Itinerary</Button>
        </Group>
      </Container>
    </div>
  );
}
