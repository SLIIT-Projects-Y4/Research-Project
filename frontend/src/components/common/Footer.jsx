import React from 'react';
import {Link} from 'react-router-dom';
import {PlaneTakeoff, Facebook, Instagram, Twitter} from 'lucide-react';

export const Footer = () => {
    return (
      <footer className="bg-desert-lilly backdrop-blur-sm border-t border-gray-100 mt-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
                  {/* Logo and Tagline */}
                  <div className="md:col-span-2">
                      <Link to="/" className="flex items-center space-x-2 group mb-6">
                          <PlaneTakeoff
                            className="text-brave-orange group-hover:scale-110 transition-transform duration-200"
                            size={24}/>
                          <span className="font-display text-2xl font-bold text-fly-by-night">
                Travel <span className="text-brave-orange">මචo</span>
              </span>
                      </Link>
                      <p className="text-welded-iron leading-relaxed max-w-md">
                          Discover breathtaking destinations, plan unforgettable journeys, and create memories that last
                          a lifetime with our comprehensive travel platform.
                      </p>

                      {/* Newsletter Signup */}
                      <div className="mt-6">
                          <p className="text-sm font-medium text-gray-700 mb-3">Stay updated with travel tips</p>
                          <div className="flex max-w-sm">
                              <input
                                type="email"
                                placeholder="Enter your email"
                                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-brave-orange/20 focus:border-brave-orange"
                              />
                              <button
                                className="px-4 py-2 bg-brave-orange text-white text-sm font-medium rounded-r-lg hover:bg-hot-embers transition-colors">
                                  Subscribe
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Quick Links */}
                  <div>
                      <h3 className="font-display text-lg font-semibold text-fly-by-night mb-6 relative">
                          Quick Links
                          <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-brave-orange rounded-full"></div>
                      </h3>
                      <ul className="space-y-3">
                          <li>
                              <Link
                                to="/home"
                                className="text-welded-iron hover:text-brave-orange transition-colors duration-200 text-sm font-medium flex items-center group"
                              >
                                  <span
                                    className="group-hover:translate-x-1 transition-transform duration-200">Home</span>
                              </Link>
                          </li>
                          <li>
                              <Link
                                to="/plan-pool"
                                className="text-welded-iron hover:text-brave-orange transition-colors duration-200 text-sm font-medium flex items-center group"
                              >
                                  <span className="group-hover:translate-x-1 transition-transform duration-200">Plan Pool</span>
                              </Link>
                          </li>
                          <li>
                              <Link
                                to="/plan/build"
                                className="text-welded-iron hover:text-brave-orange transition-colors duration-200 text-sm font-medium flex items-center group"
                              >
                                  <span className="group-hover:translate-x-1 transition-transform duration-200">Generate Plan</span>
                              </Link>
                          </li>
                          <li>
                              <Link
                                to="/flights"
                                className="text-welded-iron hover:text-brave-orange transition-colors duration-200 text-sm font-medium flex items-center group"
                              >
                                  <span
                                    className="group-hover:translate-x-1 transition-transform duration-200">Flights</span>
                              </Link>
                          </li>
                          <li>
                              <Link
                                to="/bookings"
                                className="text-welded-iron hover:text-brave-orange transition-colors duration-200 text-sm font-medium flex items-center group"
                              >
                                  <span
                                    className="group-hover:translate-x-1 transition-transform duration-200">My Trips</span>
                              </Link>
                          </li>
                      </ul>
                  </div>

                  {/* Social Links and Contacts */}
                  <div>
                      <h3 className="font-display text-lg font-semibold text-fly-by-night mb-6 relative">
                          Connect
                          <div className="absolute -bottom-2 left-0 w-8 h-0.5 bg-brave-orange rounded-full"></div>
                      </h3>

                      {/* Social Media */}
                      <div className="flex space-x-4 mb-6">
                          <a
                            href="#"
                            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-welded-iron hover:bg-brave-orange hover:text-white transition-all duration-200 group"
                            aria-label="Facebook"
                          >
                              <Facebook size={18} className="group-hover:scale-110 transition-transform"/>
                          </a>
                          <a
                            href="#"
                            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-welded-iron hover:bg-brave-orange hover:text-white transition-all duration-200 group"
                            aria-label="Instagram"
                          >
                              <Instagram size={18} className="group-hover:scale-110 transition-transform"/>
                          </a>
                          <a
                            href="#"
                            className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-welded-iron hover:bg-brave-orange hover:text-white transition-all duration-200 group"
                            aria-label="Twitter"
                          >
                              <Twitter size={18} className="group-hover:scale-110 transition-transform"/>
                          </a>
                      </div>

                      {/* Contact Info */}
                      <div className="space-y-2 text-sm text-welded-iron">
                          <p className="font-medium text-gray-700">Get in touch</p>
                          <p>support@travelmachan.com</p>
                          <p>+94 11 123 4567</p>
                      </div>
                  </div>
              </div>

              {/* Bottom Section */}
              <div className="mt-16 pt-8 border-t border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                      <div className="text-sm text-welded-iron">
                          © {new Date().getFullYear()} Travel මචo. All rights reserved.
                      </div>

                      {/* Legal Links */}
                      <div className="flex space-x-6 text-sm text-welded-iron">
                          <Link to="/privacy" className="hover:text-brave-orange transition-colors">
                              Privacy Policy
                          </Link>
                          <Link to="/terms" className="hover:text-brave-orange transition-colors">
                              Terms of Service
                          </Link>
                          <Link to="/cookies" className="hover:text-brave-orange transition-colors">
                              Cookie Policy
                          </Link>
                      </div>
                  </div>
              </div>
          </div>
      </footer>
    );
};