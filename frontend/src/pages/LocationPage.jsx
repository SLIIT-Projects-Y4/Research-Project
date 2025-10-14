import React, {useEffect, useState, useMemo} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {getById} from '@/api/locations';
import {addToPlanPool} from '@/api/planpool';
import {toast} from 'react-toastify';
import {Container, Grid, Card, Badge, Button, Text, Title, Group, Stack, Image, Box, Avatar, Loader, Center, Flex, ThemeIcon, Paper, SimpleGrid} from '@mantine/core';
import {MapPin, Plus, ChevronLeft, Star, Heart, Share2, Compass, Calendar, Info} from 'lucide-react';

export default function LocationPage() {
    const {id} = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [loc, setLoc] = useState(null);
    const [raw, setRaw] = useState(null);
    const [err, setErr] = useState(null);
    const [isFavorite, setIsFavorite] = useState(false);

    const activities = useMemo(() => {
        if (!raw?.activities) return [];
        try {
            return typeof raw.activities === 'string' ? JSON.parse(raw.activities) : raw.activities;
        } catch {
            return [];
        }
    }, [raw]);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                setLoading(true);
                const {data} = await getById(id);
                if (!mounted) return;
                setLoc(data.location);
                setRaw(data.raw || {});
            } catch (e) {
                setErr('Location not found');
            } finally {
                if (mounted) setLoading(false);
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
                location_id: loc.location_id || null,
                name: loc.name,
                city: loc.city || '',
                province: loc.province || '',
                lat: loc.lat ?? null,
                lng: loc.lng ?? null,
                avg_rating: typeof loc.avg_rating === 'number' ? loc.avg_rating : null,
                rating_count: typeof loc.rating_count === 'number' ? loc.rating_count : null,
                description: raw?.description || '',
                activities: activities,
                type: loc.type || null
            });
            toast.success('Added to plan');
        } catch (e) {
            const status = e?.response?.status;
            if (status === 409) toast.info('Already in plan');
            else toast.error('Failed to add to plan');
        }
    };

    if (loading) return (
        <Center h="100vh">
            <Loader size="lg" color="orange" />
        </Center>
    );

    if (err) return (
        <Center h="100vh">
            <Stack align="center" gap="lg">
                <Text size="xl" fw={600}>{err}</Text>
                <Button
                    leftSection={<ChevronLeft size={18} />}
                    variant="light"
                    onClick={() => navigate(-1)}
                >
                    Go back
                </Button>
            </Stack>
        </Center>
    );

    const noOfRatings = loc?.rating_count ?? (raw?.Review_Count ?? 0);

    return (
        <Box bg="gray.0" mih="100vh">
            <Container size="xl" py="xl">
                <Grid gutter="xl">
                    {/* Left - Image */}
                    <Grid.Col span={{base: 12, md: 5}}>
                        <Box pos="sticky" top={80}>
                            <Image
                                src={`/images/${raw.image}`}
                                fallbackSrc="/assets/beach.jpg"
                                alt={loc.name}
                                h={650}
                                radius="lg"
                                fit="cover"
                                style={{objectPosition: 'center'}}
                            />
                        </Box>
                    </Grid.Col>

                    {/* Right - Details */}
                    <Grid.Col span={{base: 12, md: 7}}>
                        <Stack gap="xl">
                            {/* Header Section */}
                            <Stack gap="md">
                                <Group gap="sm">
                                    {loc.type && (
                                        <Badge size="lg" color="orange" variant="filled" radius="md">
                                            {loc.type}
                                        </Badge>
                                    )}
                                    {loc?.tags && loc.tags.slice(0, 3).map((tag, idx) => (
                                        <Badge key={idx} size="md" color="gray" variant="dot" radius="md">
                                            {tag}
                                        </Badge>
                                    ))}
                                </Group>

                                <Title order={1} size={32} fw={700} lh={1.3} c="dark">
                                    {loc.name}
                                </Title>

                                <Group gap="xs">
                                    <MapPin size={18} className="text-orange-500" strokeWidth={2.5} />
                                    <Text size="md" fw={500} c="dimmed">
                                        {[loc.city, loc.province].filter(Boolean).join(', ')}
                                    </Text>
                                </Group>
                            </Stack>

                            {/* Rating Cards */}
                            {(loc.avg_rating || noOfRatings > 0) && (
                                <SimpleGrid cols={2} spacing="md">
                                    <Paper p="lg" radius="md" withBorder style={{backgroundColor: '#FFF7ED'}}>
                                        <Stack gap="xs" align="center">
                                            <Group gap={6}>
                                                <Star size={18} className="fill-orange-500 text-orange-500" />
                                                <Text size={28} fw={700} c="orange.6" lh={1}>
                                                    {loc.avg_rating ? loc.avg_rating.toFixed(1) : '0.0'}
                                                </Text>
                                            </Group>
                                            <Text size="xs" c="dimmed" fw={500} ta="center">
                                                Average Rating
                                            </Text>
                                        </Stack>
                                    </Paper>

                                    <Paper p="lg" radius="md" withBorder style={{backgroundColor: '#F8F9FA'}}>
                                        <Stack gap="xs" align="center">
                                            <Text size={28} fw={700} c="dark" lh={1}>
                                                {noOfRatings.toLocaleString()}
                                            </Text>
                                            <Text size="xs" c="dimmed" fw={500} ta="center">
                                                Total Reviews
                                            </Text>
                                        </Stack>
                                    </Paper>
                                </SimpleGrid>
                            )}

                            {/* CTA Button */}
                            <Button
                                size="lg"
                                color="orange"
                                leftSection={<Plus size={20} />}
                                fullWidth
                                onClick={handleAddToPlan}
                                radius="md"
                                styles={{
                                    root: {
                                        height: '48px',
                                        fontSize: '15px',
                                        fontWeight: 600
                                    }
                                }}
                            >
                                Add to My Travel Plan
                            </Button>

                            {/* Description */}
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
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Compass size={20} className="text-orange-500" strokeWidth={2.5} />
                                        </Box>
                                        <Title order={2} size="h4" fw={600}>
                                            About
                                        </Title>
                                    </Group>
                                    {raw?.description ? (
                                        <Text size="sm" lh={1.7} c="dimmed">
                                            {raw.description}
                                        </Text>
                                    ) : (
                                        <Text size="xs" c="dimmed" fs="italic">
                                            No description available
                                        </Text>
                                    )}
                                </Stack>
                            </Card>

                            {/* Activities */}
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
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Calendar size={20} className="text-orange-500" strokeWidth={2.5} />
                                            </Box>
                                            <Title order={2} size="h4" fw={600}>
                                                Things to Do
                                            </Title>
                                        </Group>
                                        <Stack gap="xs">
                                            {activities.map((activity, idx) => (
                                                <Paper
                                                    key={idx}
                                                    p="sm"
                                                    radius="md"
                                                    withBorder
                                                    style={{
                                                        transition: 'all 0.2s',
                                                        cursor: 'default'
                                                    }}
                                                    className="hover:shadow-sm"
                                                >
                                                    <Group gap="sm">
                                                        <Avatar
                                                            size={36}
                                                            color="orange"
                                                            variant="filled"
                                                            radius="md"
                                                        >
                                                            <Text size="sm" fw={700}>
                                                                {idx + 1}
                                                            </Text>
                                                        </Avatar>
                                                        <Text size="sm" fw={500} flex={1}>
                                                            {activity}
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