'use client';
import {useState} from 'react';
import {api} from '@/lib/api';
import LoginForm from '@/components/LoginForm';
import InvoiceTable from '@/components/InvoiceTable';

export default function Home() {
    const [token, setToken] = useState<string | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (email: string, pass: string) => {
        try {
            const result = await api.login(email, pass);
            console.log(`result: `, result);
            setToken(result.access_token);
        } catch (e) {
            console.error(e);
            alert('Login Failed: Check console for details');
        }
    };

    const loadReports = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // We default to fetching the first 10 items
            const data = await api.getReports(token);
            setReportData(data);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch reports');
        } finally {
            setIsLoading(false);
        }
    };

    // 1. If not logged in, show the Login Component
    if (!token) {
        return <LoginForm onLogin={handleLogin}/>;
    }

    // 2. If logged in, show the Dashboard
    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <span className="text-xl font-bold text-indigo-600">BillingPlatform</span>
                        </div>
                        <div className="flex items-center">
                            <span
                                className="text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                                ● Connected via Gateway
                            </span>
                            <button
                                onClick={() => setToken(null)}
                                className="ml-4 text-sm text-gray-500 hover:text-gray-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Cross-Service Reports</h1>
                            <p className="mt-1 text-sm text-gray-500">
                                Aggregating data from <strong>Invoice Service</strong> and <strong>User
                                Service</strong> via gRPC.
                            </p>
                        </div>
                        <button
                            onClick={loadReports}
                            disabled={isLoading}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {isLoading ? 'Loading...' : 'Refresh Data'}
                        </button>
                    </div>

                    {/* Stats Cards (Optional/Bonus) */}
                    {reportData && (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                            <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Total Invoices</dt>
                                <dd className="mt-1 text-3xl font-semibold text-gray-900">{reportData.total || 0}</dd>
                            </div>
                            {/* You can calculate total revenue here if you like */}
                            <div className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6">
                                <dt className="text-sm font-medium text-gray-500 truncate">Data Source</dt>
                                <dd className="mt-1 text-lg font-semibold text-gray-900">PostgreSQL (x2)</dd>
                            </div>
                        </div>
                    )}

                    {/* Data Table */}
                    <InvoiceTable invoices={reportData?.data || []}/>
                </div>
            </main>
        </div>
    );
}