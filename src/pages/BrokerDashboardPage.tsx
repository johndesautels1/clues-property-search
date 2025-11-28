/**
 * Broker Dashboard Page
 *
 * Wrapper page for the BrokerDashboard component
 * Accessible at /broker route
 */

import BrokerDashboard from '@/components/broker/BrokerDashboard';

export default function BrokerDashboardPage() {
  // Start in demo mode by default (uses test properties)
  // Set demoMode={false} to fetch from database
  return <BrokerDashboard demoMode={true} />;
}
