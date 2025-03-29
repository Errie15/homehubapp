import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">
          Välkommen till HomeHub
        </h1>
        
        <p className="text-xl mb-8 text-gray-700 dark:text-gray-300">
          Din smarta lösning för att organisera hemmet på ett enkelt och roligt sätt
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link 
            href="/auth"
            className="py-3 px-8 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            Logga in
          </Link>
          
          <Link 
            href="/auth?register=true"
            className="py-3 px-8 bg-white text-blue-600 font-medium rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors shadow-lg"
          >
            Skapa konto
          </Link>
        </div>
        
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Schemaläggning" 
            description="Skapa och hantera veckoscheman för hushållets sysslor"
            icon="📅"
          />
          <FeatureCard 
            title="Belöningar" 
            description="Samla poäng och motivera varandra med ett belöningssystem"
            icon="🏆"
          />
          <FeatureCard 
            title="Samarbete" 
            description="Samarbeta enkelt genom delat schema och uppgifter"
            icon="👨‍👩‍👧‍👦"
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: string }) {
  return (
    <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
      <div className="text-4xl mb-4">{icon}</div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}
