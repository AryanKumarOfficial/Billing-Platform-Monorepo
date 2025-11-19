interface User {
    id: string;
    name: string;
    email: string;
}

interface Invoice {
    id: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
    userId: string;
    user?: User | null;
}

interface InvoiceTableProps {
    invoices: Invoice[];
}

export default function InvoiceTable({invoices}: InvoiceTableProps) {
    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No data available.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
                <thead>
                <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                        ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Details
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Customer
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Amount
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                        Status
                    </th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                            <span className="font-mono text-xs text-gray-500">#{invoice.id.slice(0, 8)}</span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            <div className="font-medium text-gray-900">{invoice.description}</div>
                            <div
                                className="text-xs text-gray-400">{new Date(invoice.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {invoice.user ? (
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{invoice.user.name}</span>
                                    <span className="text-xs text-gray-500">{invoice.user.email}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col">
                                    <span className="text-gray-400 italic">Raw Data (No User Info)</span>
                                    <span className="text-xs font-mono text-gray-400">{invoice.userId}</span>
                                </div>
                            )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            ${(invoice.amount / 100).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                }`}>
                  {invoice.status}
                </span>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}