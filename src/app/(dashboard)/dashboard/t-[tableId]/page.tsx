import React from 'react';

export default async function TablePage({
    params,
}: {
    params: Promise<{ restaurantSlug: string; tableId: string }>;
}) {
    const { restaurantSlug, tableId } = await params;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center font-sans">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 capitalize">
                    {restaurantSlug.replace(/-/g, ' ')}
                </h1>
                <p className="text-gray-500 mb-8">
                    You are seated at <span className="font-bold text-gray-800 uppercase">{tableId.replace('t-', 'Table ')}</span>
                </p>

                <button className="w-full bg-green-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-green-600/20 hover:bg-green-700 transition-colors">
                    View Menu & Order
                </button>
            </div>
            <p className="mt-8 text-sm text-gray-400">
                Powered by SwipyEat
            </p>
        </div>
    );
}
