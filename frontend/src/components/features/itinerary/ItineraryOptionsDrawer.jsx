// src/components/itinerary/ItineraryOptionsDrawer.jsx
import React from 'react';
import {
  ActionIcon, Badge, Box, Button, Card, Drawer, Flex, Loader, Tabs, Text, ThemeIcon
} from '@mantine/core';
import { ListChecks, Star, Compass, Navigation, Lock, Replace } from 'lucide-react';

const km = (n) => (typeof n === 'number' && isFinite(n) ? `${n.toFixed(1)} km` : '—');

export default function ItineraryOptionsDrawer({
  opened,
  onClose,
  loading,
  title,
  baseStop,
  drawerData,
  activeIndex,
  itinerary,
  onOpenMaps,
  onReplace,
}) {
  const ListBlock = ({ items }) => (
    <Box>
      {(!items || items.length === 0) ? (
        <Card withBorder radius="md" p="xl" className="text-center">
          <Text c="dimmed">No options found.</Text>
        </Card>
      ) : items.map((x, i) => {
        const hasCoords = typeof x.lat === 'number' && typeof x.lng === 'number';
        const isEndpoint = activeIndex === 0 || activeIndex === (itinerary.length - 1);
        const disabledReason = isEndpoint ? 'Start/End cannot be replaced' : (!hasCoords ? 'No coordinates' : null);

        return (
          <Card key={`${x.location || x.name}-${i}`} withBorder radius="lg" p="lg" className="mb-10 hover:shadow-sm">
            <Flex justify="space-between" gap="md">
              <div className="flex-1 min-w-0">
                <Text fw={600} size="lg" className="truncate">{x.location || x.name}</Text>
                <Flex gap="xs" wrap="wrap" mt={8}>
                  {x.type && <Badge variant="light" color="blue">{x.type}</Badge>}
                  {x.province && <Badge variant="light" color="teal">{x.province}</Badge>}
                  {typeof x.avg_rating === 'number' && (
                    <Badge variant="light" color="yellow" leftSection={<Star size={12} />}>
                      {x.avg_rating.toFixed(2)}
                    </Badge>
                  )}
                  {typeof x.distance_from_base_km === 'number' && (
                    <Badge variant="light" color="gray" leftSection={<Compass size={12} />}>
                      {km(x.distance_from_base_km)} away
                    </Badge>
                  )}
                </Flex>
              </div>
              <Flex gap="xs" align="center">
                {hasCoords && (
                  <ActionIcon variant="light" color="blue" onClick={() => onOpenMaps(x.lat, x.lng, x.name)}>
                    <Navigation size={16} />
                  </ActionIcon>
                )}
                <Button
                  size="sm"
                  variant="light"
                  color="green"
                  leftSection={disabledReason ? <Lock size={14} /> : <Replace size={14} />}
                  disabled={!!disabledReason}
                  onClick={() => onReplace(x)}
                >
                  {disabledReason ? disabledReason : 'Replace'}
                </Button>
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </Box>
  );

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="right"
      size="xl"
      title={
        <Flex align="center" gap="md">
          <ThemeIcon size="lg" variant="light" color="blue" radius="xl">
            <ListChecks size={18} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="lg">Explore options</Text>
            <Text c="dimmed" size="sm">{title || 'Alternatives'}</Text>
          </div>
        </Flex>
      }
      overlayProps={{ opacity: 0.3, blur: 4 }}
      radius="xl"
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <Loader size="lg" />
          <Text c="dimmed">Finding the best alternatives…</Text>
        </div>
      ) : !drawerData ? (
        <Card withBorder radius="md" p="lg" className="text-center">
          <Text c="dimmed">No data</Text>
        </Card>
      ) : (
        <Box p="xs">
          <Tabs defaultValue="hybrid" variant="pills" radius="md">
            <Tabs.List mb="xl" className="flex-wrap">
              <Tabs.Tab value="hybrid">Smart Mix</Tabs.Tab>
              <Tabs.Tab value="nearby">Nearby ({drawerData?.nearby?.length || 0})</Tabs.Tab>
              <Tabs.Tab value="top_rated">Top Rated ({drawerData?.top_rated?.length || 0})</Tabs.Tab>
              <Tabs.Tab value="same_type">Same Type ({drawerData?.same_type?.length || 0})</Tabs.Tab>
              <Tabs.Tab value="similar_activities">Similar ({drawerData?.similar_activities?.length || 0})</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="hybrid"><ListBlock items={drawerData.hybrid} /></Tabs.Panel>
            <Tabs.Panel value="nearby"><ListBlock items={drawerData.nearby} /></Tabs.Panel>
            <Tabs.Panel value="top_rated"><ListBlock items={drawerData.top_rated} /></Tabs.Panel>
            <Tabs.Panel value="same_type"><ListBlock items={drawerData.same_type} /></Tabs.Panel>
            <Tabs.Panel value="similar_activities"><ListBlock items={drawerData.similar_activities} /></Tabs.Panel>
          </Tabs>
        </Box>
      )}
    </Drawer>
  );
}
