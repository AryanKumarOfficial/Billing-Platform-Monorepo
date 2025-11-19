'use client';
import {useState} from 'react';
import {api} from '@/lib/api';
import LoginForm from '@/components/LoginForm';
import InvoiceTable from '@/components/InvoiceTable';

type ViewMode = 'reports' | 'invoices';

export default function Home() {
    const [token, setToken] = useState<string | null>(null);
    const [data, setData] = useState<any>(null);
    const [view, setView] = useState<ViewMode>('reports');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (email: string, pass: string) => {
        try {
            const result = await api.login(email, pass);
            setToken(result.access_token);
            fetchData('reports', result.access_token);
        } catch (e) {
            console.error(e);
            alert('Login Failed');
        }
    };

    const fetchData = async (mode: ViewMode, currentToken = token) => {
        if (!currentToken) return;
        setIsLoading(true);
        setView(mode);
        setData(null);

        try {
            let result;
            if (mode === 'reports') {
                result = await api.getReports(currentToken);
            } else {
                result = await api.getInvoices(currentToken);
            }
            setData(result);
        } catch (error) {
            console.error(error);
            alert(`Failed to fetch ${mode}`);
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return <LoginForm onLogin={handleLogin}/>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-600 p-2 rounded-lg">
                                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                                     stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                </svg>
                            </div>
                            <span className="text-xl font-bold text-gray-900">BillingPlatform</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span
                                className="hidden md:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                ● Gateway Connected
                            </span>
                            <button
                                onClick={() => setToken(null)}
                                className="text-sm font-medium text-gray-500 hover:text-gray-900"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
                {/* Header & Controls */}
                <div className="md:flex md:items-center md:justify-between mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                            {view === 'reports' ? 'Cross-Service Report' : 'Invoice Registry'}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {view === 'reports'
                                ? 'Aggregated data from User & Invoice services via gRPC.'
                                : 'Raw data fetched directly from the Invoice Service.'}
                        </p>
                    </div>
                    <div className="mt-4 flex md:ml-4 md:mt-0">
                        <div className="inline-flex rounded-md shadow-sm" role="group">
                            <button
                                onClick={() => fetchData('reports')}
                                className={`px-4 py-2 text-sm font-medium border rounded-l-lg ${
                                    view === 'reports'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Detailed Reports
                            </button>
                            <button
                                onClick={() => fetchData('invoices')}
                                className={`px-4 py-2 text-sm font-medium border rounded-r-lg -ml-px ${
                                    view === 'invoices'
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                Raw Invoices
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                            <dd className="mt-1 text-3xl font-semibold text-gray-900">
                                {data?.total || 0}
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Data Source</dt>
                            <dd className="mt-1 text-xl font-semibold text-gray-900">
                                {view === 'reports' ? 'Gateway (Aggregator)' : 'Invoice Service'}
                            </dd>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                            <dt className="text-sm font-medium text-gray-500 truncate">Protocol</dt>
                            <dd className="mt-1 text-xl font-semibold text-gray-900">gRPC / Protobuf</dd>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                    {isLoading ? (
                        <div className="p-20 text-center text-gray-500">
                            <div
                                className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent"></div>
                            <p className="mt-2">Fetching data via Consul service discovery...</p>
                        </div>
                    ) : (
                        <InvoiceTable invoices={data?.data || data?.invoices || []}/>
                    )}
                </div>
            </main>
        </div>
    );
}