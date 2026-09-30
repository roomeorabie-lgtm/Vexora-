import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { Sidebar, NavItemKey } from './components/Sidebar.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ConversationsView } from './components/ConversationsView.tsx';
import { CustomersView } from './components/CustomersView.tsx';
import { ServicesPricingView } from './components/ServicesPricingView.tsx';
import { OffersView } from './components/OffersView.tsx';
import { AISettingsView } from './components/AISettingsView.tsx';
import { InstagramSetupView } from './components/InstagramSetupView.tsx';
import { LogsView } from './components/LogsView.tsx';
import { TestingLabView } from './components/TestingLabView.tsx';
import { DeploymentGuideView } from './components/DeploymentGuideView.tsx';
import { SystemSettingsView } from './components/SystemSettingsView.tsx';
import { SimulatorModal } from './components/SimulatorModal.tsx';
import { api } from './services/api.ts';
import type { DashboardStats, Customer, AutomationLog } from './types/index.ts';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavItemKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Global app state
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);

  const loadAllData = async () => {
    try {
      const [s, c, l] = await Promise.all([
        api.getStats().catch(() => null),
        api.getCustomers().catch(() => []),
        api.getLogs(20).catch(() => [])
      ]);
      if (s) setStats(s);
      if (c) setCustomers(c);
      if (l) setLogs(l);
    } catch (err) {
      console.error('Error fetching global app state:', err);
    }
  };

  useEffect(() => {
    loadAllData();
    // Poll stats and logs periodically for real-time live feed feel
    const interval = setInterval(() => {
      api.getStats().then(s => setStats(s)).catch(() => {});
      api.getLogs(15).then(l => setLogs(l)).catch(() => {});
    }, 7000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleAI = async () => {
    try {
      const updated = await api.toggleAIAutomation();
      if (stats) {
        setStats({ ...stats, ai_automation_enabled: updated.is_ai_enabled });
      }
      loadAllData();
    } catch (err) {
      console.error('Failed to toggle AI Automation switch:', err);
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation */}
      <Header
        stats={stats}
        onToggleAI={handleToggleAI}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenTesting={() => setCurrentTab('testing-lab')}
        onToggleSidebar={() => setSidebarOpen(prev => !prev)}
        darkMode={darkMode}
        onToggleTheme={() => setDarkMode(prev => !prev)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {currentTab === 'dashboard' && (
              <DashboardView
                stats={stats}
                logs={logs}
                customers={customers}
                onNavigate={(tab) => setCurrentTab(tab)}
                onOpenSimulator={() => setIsSimulatorOpen(true)}
                onOpenTesting={() => setCurrentTab('testing-lab')}
              />
            )}

            {currentTab === 'conversations' && (
              <ConversationsView onRefreshStats={loadAllData} />
            )}

            {currentTab === 'customers' && (
              <CustomersView
                customers={customers}
                onRefresh={loadAllData}
                onOpenConversation={(custId) => {
                  setCurrentTab('conversations');
                }}
              />
            )}

            {(currentTab === 'services' || currentTab === 'pricing') && (
              <ServicesPricingView />
            )}

            {currentTab === 'offers' && (
              <OffersView />
            )}

            {currentTab === 'ai-settings' && (
              <AISettingsView />
            )}

            {currentTab === 'instagram-setup' && (
              <InstagramSetupView />
            )}

            {currentTab === 'logs' && (
              <LogsView />
            )}

            {currentTab === 'testing-lab' && (
              <TestingLabView />
            )}

            {currentTab === 'deployment-guide' && (
              <DeploymentGuideView />
            )}

            {currentTab === 'system-settings' && (
              <SystemSettingsView />
            )}
          </div>
        </main>

        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
        />
      </div>

      {/* Instagram DM Simulator Modal */}
      <SimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onRefreshData={loadAllData}
      />
    </div>
  );
}
