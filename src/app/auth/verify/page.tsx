'use client';

import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg text-center">
        <div className="text-6xl mb-4">✉️</div>
        <h1 className="text-2xl font-bold">Bekräfta din e-post</h1>
        
        <p className="my-4 text-gray-600 dark:text-gray-400">
          Vi har skickat ett bekräftelsemail till din e-postadress. 
          Klicka på länken i mailet för att aktivera ditt konto.
        </p>
        
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
          <h2 className="font-medium mb-2">Tips</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Om du inte ser mailet, kolla i din skräppost eller spam-mapp. 
            Det kan ibland ta några minuter för mailet att levereras.
          </p>
        </div>
        
        <div className="mt-8">
          <Link 
            href="/auth"
            className="text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            Tillbaka till inloggning
          </Link>
        </div>
      </div>
    </div>
  );
} 