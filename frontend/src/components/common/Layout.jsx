import React from 'react';
import {useLocation} from 'react-router-dom';
import {Navbar} from './Navbar';
import {Footer} from './Footer';

export const Layout = ({children}) => {
    const location = useLocation();

    const hideOnRoutes = ['/login', '/register', '/chat' ];

    const shouldHideLayout = hideOnRoutes.includes(location.pathname);

    return (
      <div className=" min-h-screen flex flex-col">
          {!shouldHideLayout && <Navbar/>}
          <main className="flex-grow">{children}</main>
          {!shouldHideLayout && <Footer/>}
      </div>
    );
};
