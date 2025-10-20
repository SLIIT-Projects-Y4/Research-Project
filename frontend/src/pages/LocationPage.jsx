import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getById } from '@/api/locations';
import { addToPlanPool } from '@/api/planpool';
import { toast } from 'react-toastify';
import {
  Container,
  Grid,
  Card,
  Badge,
  Button,
  Text,
  Title,
  Group,
  Stack,
  Image,
  Box,
  Avatar,
  Loader,
  Center,
  Paper,
  SimpleGrid,
} from '@mantine/core';
import { MapPin, ChevronLeft, Star, Compass, Calendar } from 'lucide-react';

export default function LocationPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loc, setLoc] = useState(null);
  const [raw, setRaw] = useState(null);
  const [err, setErr] = useState(null);

  const activities = useMemo(() => {
    const src = raw?.activities;
    if (!src) return [];
    try {
      return typeof src === 'string' ? JSON.parse(src) : Array.isArray(src) ? src : [];
    } catch {
      return [];
    }
  }, [raw]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await getById(id);
        if (!mounted) return;
        setLoc(data.location);
        setRaw(data.raw || {});
      } catch {
        setErr('Location not found');
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const handleAddToPlan = async () => {
    if (!loc) return;
    try {
      await addToPlanPool({
        location_id: loc.location_id ?? null,
        name: loc.name,
        city: loc.city || '',
        province: loc.province || '',
        lat: loc.lat ?? null,
        lng: loc.lng ?? null,
        avg_rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : null,
        rating_count: typeof loc.rating_count === 'number' ? loc.rating_count : null,
        description: raw?.description || '',
        activities,
        type: loc.type || null,
      });
      toast.success('Added to plan');
    } catch (e) {
      const status = e?.response?.status;
      if (status === 409) toast.info('Already in plan');
      else toast.error('Failed to add to plan');
    }
  };

  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" color="orange" />
      </Center>
    );
  }

  if (err) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="lg">
          <Text size="xl" fw={600}>
            {err}
          </Text>
          <Button leftSection={<ChevronLeft size={18} />} variant="light" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </Stack>
      </Center>
    );
  }

  const noOfRatings = loc?.rating_count ?? (raw?.Review_Count ?? 0);
  const altText = loc?.name || 'Location image';

  return (
    <Box mih="80vh" mt={60}>
      <Container size="xl" py="xl">
        <Grid gutter={{ base: 'xl', md: 40, lg: 64 }} align="stretch">
          <Grid.Col span={{ base: 12, md: 6, lg: 5 }}>
            <Box pos="sticky" top={120}>
              <Image
                src={raw?.image ? `/images/${raw.image}` : undefined}
                withPlaceholder
                fallbackSrc="/assets/beach.jpg"
                alt={altText}
                radius="lg"
                fit="cover"
                h={{ base: 300, sm: 420, md: 780, lg: 780 }}
                style={{ objectPosition: 'center' }}
              />
            </Box>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6, lg: 7 }}>
            <Stack gap="xl">
              <Stack gap="md">
                <Group gap="sm" wrap="wrap">
                  {loc?.type && (
                    <Badge
                      size="lg"
                      color="orange"
                      variant="filled"
                      radius="md"
                      styles={{ label: { fontWeight: 700, fontSize: '0.9rem' } }}
                    >
                      {loc.type}
                    </Badge>
                  )}
                  {Array.isArray(loc?.tags) &&
                    loc.tags.slice(0, 4).map((tag, idx) => (
                      <Badge
                        key={idx}
                        size="md"
                        color="gray"
                        variant="dot"
                        radius="md"
                        styles={{ label: { fontSize: '0.85rem' } }}
                      >
                        {tag}
                      </Badge>
                    ))}
                </Group>

                <Title order={1} fz={{ base: 20, sm: 22, md: 26, lg: 30 }} fw={800} lh={1.2} c="dark">
                  {loc?.name}
                </Title>

                <Group gap="xs">
                  <MapPin size={18} className="text-orange-500" strokeWidth={2.5} />
                  <Text fz={{ base: 'xs', md: 'sm', lg: 'md' }} fw={500} c="dimmed">
                    {[loc?.city, loc?.province].filter(Boolean).join(', ')}
                  </Text>
                </Group>
              </Stack>

              {(typeof loc?.avg_rating === 'number' || noOfRatings > 0) && (
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <Paper p="lg" radius="md" withBorder style={{ backgroundColor: '#FFF7ED' }}>
                    <Stack gap="xs" align="center">
                      <Group gap={6}>
                        <Star size={18} className="fill-orange-500 text-orange-500" />
                        <Text fz={{ base: 18, md: 20, lg: 24 }} fw={800} c="orange.6" lh={1}>
                          {typeof loc?.avg_rating === 'number' ? loc.avg_rating.toFixed(1) : '0.0'}
                        </Text>
                      </Group>
                      <Text fz={{ base: 'xs', md: 'xs' }} c="dimmed" fw={500} ta="center">
                        Average Rating
                      </Text>
                    </Stack>
                  </Paper>

                  <Paper p="lg" radius="md" withBorder>
                    <Stack gap="xs" align="center">
                      <Text fz={{ base: 18, md: 20, lg: 24 }} fw={800} c="dark" lh={1}>
                        {Number(noOfRatings || 0).toLocaleString()}
                      </Text>
                      <Text fz={{ base: 'xs', md: 'xs' }} c="dimmed" fw={500} ta="center">
                        Total Reviews
                      </Text>
                    </Stack>
                  </Paper>
                </SimpleGrid>
              )}

              <Button
                size="lg"
                color="orange"
                fullWidth
                onClick={handleAddToPlan}
                radius="md"
                styles={{ root: { height: 48, fontWeight: 700, fontSize: '0.95rem' } }}
              >
                Add to My Travel Plan
              </Button>

              <Card padding="lg" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="sm">
                    <Box
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '8px',
                        backgroundColor: '#FFF7ED',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Compass size={20} className="text-orange-500" strokeWidth={2.5} />
                    </Box>
                    <Title order={2} fz={{ base: 16, md: 18, lg: 20 }} fw={700}>
                      About
                    </Title>
                  </Group>
                  {raw?.description ? (
                    <Text fz={{ base: 'xs', md: 'sm', lg: 'sm' }} lh={1.7} c="dimmed">
                      {raw.description}
                    </Text>
                  ) : (
                    <Text fz="xs" c="dimmed" fs="italic">
                      No description available
                    </Text>
                  )}
                </Stack>
              </Card>

              {activities.length > 0 && (
                <Card padding="lg" radius="md" withBorder>
                  <Stack gap="md">
                    <Group gap="sm">
                      <Box
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '8px',
                          backgroundColor: '#FFF7ED',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Calendar size={20} className="text-orange-500" strokeWidth={2.5} />
                      </Box>
                      <Title order={2} fz={{ base: 16, md: 18, lg: 20 }} fw={700}>
                        Things to Do
                      </Title>
                    </Group>

                    <Stack gap="xs">
                      {activities.map((activity, idx) => (
                        <Paper
                          key={`${idx}-${String(activity).slice(0, 20)}`}
                          p="sm"
                          radius="md"
                          withBorder
                          style={{ transition: 'box-shadow 0.15s ease' }}
                          className="hover:shadow-sm"
                        >
                          <Group gap="sm" align="center">
                            <Avatar size={36} color="orange" variant="filled" radius="md">
                              <Text fz="sm" fw={800}>
                                {idx + 1}
                              </Text>
                            </Avatar>
                            <Text fz={{ base: 'xs', md: 'sm', lg: 'sm' }} fw={500} style={{ flex: 1 }}>
                              {String(activity)}
                            </Text>
                          </Group>
                        </Paper>
                      ))}
                    </Stack>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Grid.Col>
        </Grid>
      </Container>
    </Box>
  );
}