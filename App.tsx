
import React from 'react';
import { BackgroundGenerator } from './components/BackgroundGenerator.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';

const App = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <BackgroundGenerator />
      </main>
      <Footer />
    </div>
  );
};

export default App;
