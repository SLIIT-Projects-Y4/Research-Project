import React from "react";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

export const Footer = () => (
    <footer className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/5 rounded-full blur-2xl"></div>
        </div>

        {/* Newsletter Section */}
        <div className="relative z-10 px-6 lg:px-8 py-16">
            <div className="max-w-7xl mx-auto">
                <div className="bg-gradient-to-r from-purple-600/20 to-orange-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 lg:p-12 mb-16">
                    <div className="text-center max-w-2xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-6">
                            Stay in the loop
                        </h2>
                        <p className="text-gray-300 text-lg mb-8">
                            Get the latest travel deals, destination guides, and insider tips delivered to your inbox.
                        </p>
                        <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
                            <div className="relative flex-1">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    required
                                    aria-label="Email address"
                                    className="w-full px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-orange-600 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                            >
                                Subscribe
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Footer Content */}
                <div className="grid grid-cols-1 lg:grid-cols-6 gap-12 mb-12">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <h3 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent mb-6">
                            Jadoo.
                        </h3>
                        <p className="text-gray-300 text-lg leading-relaxed mb-8">
                            Plan Your trip like you want it. Now on everyone's interests. We are here to help you find the best deals and experiences for your next adventure.
                        </p>

                        {/* Social Links */}
                        <div className="flex space-x-4">
                            <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 transition-all duration-300" aria-label="Facebook">
                                <Facebook className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
                            </a>
                            <a href="#" className="w-12 h-12 flex items-center justify-center bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl hover:scale-110 transition-all duration-300 shadow-lg" aria-label="Instagram">
                                <Instagram className="w-5 h-5 text-white" />
                            </a>
                            <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 transition-all duration-300" aria-label="Twitter">
                                <Twitter className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
                            </a>
                            <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl hover:bg-white/20 hover:scale-110 transition-all duration-300" aria-label="LinkedIn">
                                <Linkedin className="w-5 h-5 text-gray-300 hover:text-white transition-colors" />
                            </a>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="lg:col-span-4 grid grid-cols-4 md:grid-cols-4 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold text-white mb-6">Company</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">About Us</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Careers</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Mobile App</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Press</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-white mb-6">Support</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Help Center</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Contact Us</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Live Chat</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Safety</a></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="text-lg font-semibold text-white mb-6">Services</h4>
                            <ul className="space-y-4">
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Itinerary Plans</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Hotels</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Car Rental</a></li>
                                <li><a href="#" className="text-gray-300 hover:text-white transition-colors duration-300 hover:translate-x-1 transform inline-block">Travel Guides</a></li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-white/10 pt-8">
                    <div className="text-center">
                        <p className="text-gray-400">
                            &copy; 2025 Chaloo. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </footer>
);