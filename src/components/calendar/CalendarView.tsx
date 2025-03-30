import { useMemo } from 'react';

export type CalendarEvent = {
  id: number;
  title: string;
  assignedTo: string;
  dayOfWeek: number; // 0-6 för måndag-söndag
  points: number;
  category: string;
  startTime?: string;
  endTime?: string;
  isRecurring: boolean;
  color?: string;
};

interface CalendarViewProps {
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  onAddClick?: (dayOfWeek: number) => void;
  onDeleteEvent?: (id: number) => void;
}

export default function CalendarView({ 
  events, 
  onEventClick, 
  onAddClick,
  onDeleteEvent 
}: CalendarViewProps) {
  const daysOfWeek = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
  const hourMarkers = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => `${i}:00`);
  }, []);
  
  // Organisera händelser efter dag
  const eventsByDay = useMemo(() => {
    const days: CalendarEvent[][] = Array.from({ length: 7 }, () => []);
    events.forEach(event => {
      days[event.dayOfWeek].push(event);
    });
    return days;
  }, [events]);

  // Få färg baserat på kategori
  const getCategoryColor = (category: string): string => {
    const categoryColors: Record<string, string> = {
      'Städning': 'bg-blue-100 border-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
      'Matlagning': 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
      'Inköp': 'bg-purple-100 border-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
      'Tvätt': 'bg-yellow-100 border-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700',
      'Underhåll': 'bg-orange-100 border-orange-300 dark:bg-orange-900/30 dark:border-orange-700',
      'Övrigt': 'bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600',
    };
    
    return categoryColors[category] || categoryColors['Övrigt'];
  };

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 min-w-[900px]">
        {/* Veckodagsrubriker */}
        {daysOfWeek.map((day) => (
          <div key={`header-${day}`} className="border-b border-r border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-900 text-center sticky top-0 z-10">
            <h3 className="font-medium">{day}</h3>
          </div>
        ))}

        {/* Kalenderdagar */}
        {daysOfWeek.map((day, dayIndex) => (
          <div key={`day-${day}`} className="border-r border-gray-200 dark:border-gray-700 min-h-[600px] relative">
            {/* Timmmarkörer (endast i första kolumnen) */}
            {dayIndex === 0 && hourMarkers.map((hour, i) => (
              <div 
                key={`hour-${i}`} 
                className="absolute w-[700%] h-8 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 pl-1"
                style={{ top: `${i * 2}rem` }}
              >
                {hour}
              </div>
            ))}

            {/* Händelser för dagen */}
            <div className="p-2 relative z-10 h-full">
              {eventsByDay[dayIndex].length === 0 ? (
                <div 
                  className="text-center mt-4"
                  onClick={() => onAddClick && onAddClick(dayIndex)}
                >
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    + Lägg till
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {eventsByDay[dayIndex].map(event => {
                    // Konvertera startTime och endTime till positioner om de finns
                    let topPosition = null;
                    let height = null;
                    
                    if (event.startTime) {
                      const [hours, minutes] = event.startTime.split(':').map(Number);
                      topPosition = (hours * 2) + (minutes / 30);
                      
                      if (event.endTime) {
                        const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                        const endPosition = (endHours * 2) + (endMinutes / 30);
                        height = endPosition - topPosition;
                      } else {
                        height = 2; // Default höjd om ingen sluttid
                      }
                    }
                    
                    return (
                      <div 
                        key={`event-${event.id}`}
                        className={`${getCategoryColor(event.category)} border p-2 rounded-lg cursor-pointer transition-opacity hover:opacity-90 ${
                          topPosition === null ? '' : 'absolute w-[calc(100%-1rem)]'
                        }`}
                        style={
                          topPosition !== null ? {
                            top: `${topPosition}rem`,
                            height: `${height}rem`,
                            minHeight: '2rem'
                          } : {}
                        }
                        onClick={() => onEventClick && onEventClick(event)}
                      >
                        <div className="flex justify-between items-start">
                          <h4 className="font-medium text-sm">{event.title}</h4>
                          {onDeleteEvent && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteEvent(event.id);
                              }}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {event.assignedTo}
                        </p>
                        {event.startTime && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {event.startTime} {event.endTime && `- ${event.endTime}`}
                          </p>
                        )}
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {event.category}
                          </span>
                          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 text-xs font-medium px-2 py-0.5 rounded-full">
                            {event.points} p
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 