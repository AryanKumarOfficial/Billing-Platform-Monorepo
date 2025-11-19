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
    user: User | null;
}

interface InvoiceTableProps {
    invoices: Invoice[];
}

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
    if (!invoices || invoices.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500">
                No invoices found. Click "Fetch Reports" to load data.
            </div>
        );
    }

    return (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Status</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                {invoices.map((invoice) => (
                    <tr key={invoice.id}>
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                }`}>
                  {invoice.status}
                </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {invoice.description}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                            ${(invoice.amount / 100).toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {invoice.user ? (
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900">{invoice.user.name}</span>
                                    <span className="text-xs text-gray-400">{invoice.user.email}</span>
                                </div>
                            ) : (
                                <span className="text-red-400 italic">Unknown User</span>
                            )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}