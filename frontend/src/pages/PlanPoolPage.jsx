import React, { useEffect, useState } from 'react';
import { getPlanPool, removeFromPlanPool } from '../api/planpool';
import { toast } from 'react-toastify';
import { Plus, Sparkles, Search, Heart, Navigation, Compass, ChevronLeft, ChevronRight, CalendarPlus } from 'lucide-react';
import PlanPoolCard from '../components/features/plan-pool/PlanPoolCard.jsx';
import { Link } from 'react-router-dom';

export default function PlanPoolPage() {
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const load = async () => {
        try {
            setLoading(true);
            const res = await getPlanPool();
            setItems(Array.isArray(res?.data) ? res.data : []);
        } catch {
            toast.error('Failed to load plan pool');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const onRemove = async (location_id) => {
        try {
            await removeFromPlanPool(location_id);
            setItems((prev) => prev.filter((x) => x.location_id !== location_id));
            toast.success('Removed from plan');
        } catch {
            toast.error('Failed to remove');
        }
    };

    const handleCardClick = (location) => {
        console.log('Clicked on location:', location);
    };

    const filteredItems = items.filter(item =>
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.province?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentItems = filteredItems.slice(startIndex, endIndex);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handlePageClick = (page) => {
        setCurrentPage(page);
    };

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-heart-of-ice/50 shadow-sm">
                    <div className="animate-pulse">
                        <div className="flex items-center space-x-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-heart-of-ice to-malibu-sun rounded-xl"></div>
                            <div className="flex-1 space-y-3">
                                <div
                                    className="h-5 bg-gradient-to-r from-heart-of-ice via-lynx-white to-heart-of-ice rounded-lg w-3/4"></div>
                                <div
                                    className="h-4 bg-gradient-to-r from-heart-of-ice via-lynx-white to-heart-of-ice rounded-lg w-1/2"></div>
                                <div className="flex space-x-2">
                                    <div
                                        className="h-3 bg-gradient-to-r from-heart-of-ice to-lynx-white rounded-full w-16"></div>
                                    <div
                                        className="h-3 bg-gradient-to-r from-heart-of-ice to-lynx-white rounded-full w-20"></div>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-gradient-to-br from-heart-of-ice to-malibu-sun rounded-xl"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-24 px-6">
            <div className="relative mb-8">
                <div
                    className="absolute -top-4 -left-4 w-24 h-24 bg-gradient-to-br from-brave-orange/10 to-hot-embers/10 rounded-full blur-xl"></div>
                <div
                    className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-ocean-depths/10 to-malibu-sun/10 rounded-full blur-xl"></div>
                <div
                    className="relative w-28 h-28 mx-auto bg-gradient-to-br from-heart-of-ice via-white to-malibu-sun rounded-3xl flex items-center justify-center shadow-xl border border-heart-of-ice/50">
                    <div
                        className="absolute inset-0 bg-gradient-to-br from-brave-orange/5 to-hot-embers/5 rounded-3xl"></div>
                    <Compass className="w-14 h-14 text-ocean-depths relative z-10" strokeWidth={1.5} />
                    <div
                        className="absolute -top-2 -right-2 w-8 h-8 bg-brave-orange/20 rounded-full flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-brave-orange" />
                    </div>
                    <div
                        className="absolute -bottom-2 -left-2 w-6 h-6 bg-ocean-depths/20 rounded-full flex items-center justify-center">
                        <Heart className="w-3 h-3 text-ocean-depths" />
                    </div>
                </div>
            </div>

            <h3 className="font-display text-3xl font-bold text-midnight-dreams mb-4 leading-tight">
                Your adventure awaits
            </h3>
            <p className="text-lg text-welded-iron/70 mb-10 max-w-md mx-auto leading-relaxed">
                Discover amazing destinations and start crafting your perfect travel experience.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                    className="inline-flex items-center px-6 py-4 bg-white/80 backdrop-blur-sm text-midnight-dreams font-medium rounded-2xl border border-heart-of-ice hover:bg-white hover:shadow-lg transition-all duration-300 hover:cursor-pointer">
                    <Plus className="w-5 h-5 mr-2" />
                    Start Exploring
                </button>
                <button
                    className="inline-flex items-center px-6 py-4 bg-white/80 backdrop-blur-sm text-midnight-dreams font-medium rounded-2xl border border-heart-of-ice hover:bg-white hover:shadow-lg transition-all duration-300 hover:cursor-pointer">
                    <Navigation className="w-5 h-5 mr-2" />
                    Browse Categories
                </button>
            </div>
        </div>
    );

    const PaginationControls = () => {
        if (totalPages <= 1) return null;

        const getPageNumbers = () => {
            const pages = [];
            const showPages = 5;

            if (totalPages <= showPages) {
                for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                if (currentPage <= 3) {
                    for (let i = 1; i <= Math.min(showPages, totalPages); i++) {
                        pages.push(i);
                    }
                } else if (currentPage >= totalPages - 2) {
                    for (let i = totalPages - showPages + 1; i <= totalPages; i++) {
                        pages.push(i);
                    }
                } else {
                    const start = currentPage - 2;
                    const end = currentPage + 2;
                    for (let i = start; i <= end; i++) {
                        pages.push(i);
                    }
                }
            }
            return pages;
        };

        return (
            <div className="flex items-center justify-center space-x-2 mt-8 mb-4">
                <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${currentPage === 1
                            ? 'text-welded-iron/40 cursor-not-allowed'
                            : 'text-midnight-dreams hover:bg-white/80 hover:shadow-md hover:cursor-pointer'
                        }`}
                >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                </button>
                <div className="flex items-center space-x-4">
                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            onClick={() => handlePageClick(page)}
                            className={`w-10 h-10 rounded-xl font-medium transition-all duration-200 ${currentPage === page
                                    ? 'bg-brave-orange text-white shadow-lg transform scale-110'
                                    : 'text-midnight-dreams hover:bg-white/80 hover:shadow-md hover:cursor-pointer'
                                }`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                    className={`flex items-center px-4 py-2 rounded-xl font-medium transition-all duration-200 ${currentPage === totalPages
                            ? 'text-welded-iron/40 cursor-not-allowed'
                            : 'text-midnight-dreams hover:bg-white/80 hover:shadow-md hover:cursor-pointer'
                        }`}
                >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen ">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute top-1/4 -left-32 w-64 h-64 bg-gradient-to-br from-brave-orange/5 to-hot-embers/5 rounded-full blur-3xl"></div>
                <div
                    className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-ocean-depths/5 to-malibu-sun/5 rounded-full blur-3xl"></div>
                <div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-heart-of-ice/10 to-lynx-white/10 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 mt-20">
                <div className="mb-5 flex flex-col items-start">
                    <div className="text-left mb-8">
                        <h1
                            className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-brave-orange leading-tight">
                            Plan Pool
                        </h1>
                    </div>
                    {!loading && items.length > 0 && (
                        <div className="w-full flex items-center justify-between mb-8">
                            {/* Search Bar */}
                            <div className="relative w-full max-w-xs">
                                <div className="absolute z-10 inset-y-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-welded-iron/50" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Search destinations..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="min-w-lg pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-heart-of-ice/50 rounded-2xl text-midnight-dreams placeholder-welded-iron/50 focus:outline-none focus:ring-2 focus:ring-brave-orange/30 focus:border-brave-orange/50 transition-all duration-300 shadow-sm"
                                />
                            </div>
                            {/* Plan a Trip Button */}
                            <Link to="/plan/create">
                                <button
                                    className="inline-flex items-center px-6 py-3 bg-brave-orange text-white font-medium rounded-lg shadow-lg hover:bg-hot-embers transition-all duration-300 hover:cursor-pointer">
                                    <CalendarPlus className="w-5 h-5 mr-2" />
                                    Generate Plan
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
                <div className="space-y-8">
                    {loading ? (
                        <LoadingSkeleton />
                    ) : items.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <>
                            {filteredItems.length === 0 ? (
                                <div className="text-center py-16">
                                    <div
                                        className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-heart-of-ice to-malibu-sun rounded-2xl flex items-center justify-center shadow-lg">
                                        <Search className="w-10 h-10 text-welded-iron/60" />
                                    </div>
                                    <h3 className="font-display text-2xl font-bold text-midnight-dreams mb-3">
                                        No matches found
                                    </h3>
                                    <p className="text-welded-iron/70 mb-6">
                                        Try adjusting your search terms
                                    </p>
                                    <button
                                        onClick={() => setSearchTerm('')}
                                        className="text-brave-orange hover:text-hot-embers font-medium transition-colors duration-200"
                                    >
                                        Clear search
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <div>
                                            <h2 className="font-display text-2xl font-bold text-midnight-dreams mb-1">
                                                Saved Destinations
                                            </h2>
                                            <p className="text-welded-iron/60 text-sm">
                                                Showing {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} of {filteredItems.length} destinations
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4">
                                        {currentItems.map((loc, index) => (
                                            <div
                                                key={loc.location_id}
                                                className="animate-in fade-in slide-in-from-bottom-4 hover:scale-[1.02] transition-transform duration-300"
                                                style={{
                                                    animationDelay: `${index * 100}ms`,
                                                    animationFillMode: 'both'
                                                }}
                                            >
                                                <div className="group relative">
                                                    <div
                                                        className="absolute -inset-0.5 bg-gradient-to-r from-brave-orange/20 via-hot-embers/20 to-ocean-depths/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                                                    <div
                                                        className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-heart-of-ice/50 shadow-sm group-hover:shadow-xl transition-all duration-300">
                                                        <PlanPoolCard
                                                            name={loc.name}
                                                            city={loc.city}
                                                            province={loc.province}
                                                            onRemoveLocationIconClick={() => onRemove(loc.location_id)}
                                                            onClick={() => handleCardClick(loc)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <PaginationControls />
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}