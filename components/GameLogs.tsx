import React, { useEffect, useState } from 'react';
import { gameLogger } from '../lib/utils/logger';

export const GameLogs: React.FC = () => {
    const [logs, setLogs] = useState<string>('');

    useEffect(() => {
        const updateLogs = () => {
            setLogs(gameLogger.getLogs());
        };

        // Обновляем логи каждую секунду
        const interval = setInterval(updateLogs, 1000);
        updateLogs(); // Первоначальное обновление

        return () => clearInterval(interval);
    }, []);

    if (!logs) return null;

    return (
        <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded-lg shadow-lg max-w-md max-h-96 overflow-auto">
            <h3 className="text-lg font-bold mb-2 text-white">Game Logs</h3>
            <pre className="text-sm text-gray-300 whitespace-pre-wrap">
                {logs}
            </pre>
        </div>
    );
}; 