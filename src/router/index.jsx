import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import AdminLayout from '@/layouts/AdminLayout';
import { RequireAuth, RequirePermission } from './guards';

import Login from '@/features/auth/Login';
import ForgotPassword from '@/features/auth/ForgotPassword';
import Dashboard from '@/features/dashboard/Dashboard';
import Pigs from '@/features/pigs/Pigs';
import PigDetails from '@/features/pigs/PigDetails';
import Feeding from '@/features/feeding/Feeding';
import Medication from '@/features/medication/Medication';
import Environment from '@/features/environment/Environment';
import ModuleNotBuilt from '@/components/common/ModuleNotBuilt';

const pending = (name, phase, includes) => <ModuleNotBuilt name={name} phase={phase} includes={includes} />;
const guarded = (permission, element) => <RequirePermission permission={permission}>{element}</RequirePermission>;

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>

      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/pigs" element={<Pigs />} />
        <Route path="/pigs/:pigId" element={<PigDetails />} />

        {/* Built */}
        <Route path="/feeding" element={guarded('feeding', <Feeding />)} />
        <Route path="/medication" element={guarded('medication', <Medication />)} />
        <Route path="/environment" element={guarded('environment', <Environment />)} />

        {/* Still placeholders */}
        <Route path="/reproduction" element={pending('Reproduction Management', 'build phase 5', ['Breeding Records', 'Pregnancy Tracking', 'Farrowing Records'])} />
        <Route path="/growth-harvest" element={pending('Growth & Harvest', 'build phase 5', ['Weight Records', 'Growth Analysis', 'Harvest Readiness'])} />
        <Route path="/ai-screening" element={pending('AI Image Screening', 'build phase 6', ['Camera capture', 'Upload fallback', 'Mock analysis', 'Screening history'])} />
        <Route path="/inventory" element={pending('Inventory Management', 'build phase 7', ['Items', 'Stock movements', 'Low-stock alerts'])} />
        <Route path="/finance" element={guarded('finance', pending('Finance Management', 'build phase 7', ['Overview', 'Expenses', 'Income', 'Transactions']))} />
        <Route path="/reports" element={pending('Reports', 'build phase 8', ['Category and date filters', 'Charts', 'CSV export', 'Print view'])} />
        <Route path="/alerts" element={pending('Alerts', 'build phase 8', ['Alert list', 'Severity filters', 'Acknowledgement'])} />
        <Route path="/users" element={guarded('users', pending('User Management', 'build phase 8', ['User list', 'Add/Edit user', 'Activate/Deactivate']))} />
        <Route path="/settings" element={pending('Settings', 'build phase 8', ['Farm profile', 'Thresholds', 'Harvest criteria', 'Demo-mode status'])} />
      </Route>

      <Route path="*" element={(
        <div className="empty center-col" style={{ minHeight: '100vh', justifyContent: 'center' }}>
          <h2>404 — Page not found</h2>
          <p>The page you requested does not exist in this prototype.</p>
          <a className="btn btn-primary" href="/dashboard">Back to dashboard</a>
        </div>
      )} />
    </Routes>
  );
}
