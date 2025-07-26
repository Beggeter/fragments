import React, { useState, useEffect } from 'react';

const InvoiceSupportInfo: React.FC = () => {
  const [supportInfo, setSupportInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSupport = async () => {
      try {
        const webApp = (window as any).Telegram?.WebApp;
        
        // Проверяем TMA SDK
        let tmaSupported = false;
        try {
          const { invoice } = await import('@telegram-apps/sdk');
          tmaSupported = invoice.isSupported();
        } catch (e) {
          console.log('TMA SDK not available');
        }

        const info = {
          telegramWebApp: !!webApp,
          webAppVersion: webApp?.version || 'Unknown',
          platform: webApp?.platform || 'Unknown',
          userAgent: navigator.userAgent,
          tmaSDK: tmaSupported,
          webAppOpenInvoice: !!webApp?.openInvoice,
          mainButtonShowInvoice: !!webApp?.mainButton?.showInvoice,
          hasAnyInvoiceMethod: !!(webApp?.openInvoice || webApp?.mainButton?.showInvoice),
          timestamp: new Date().toISOString()
        };

        setSupportInfo(info);
      } catch (error) {
        console.error('Error checking support:', error);
        setSupportInfo({ error: error instanceof Error ? error.message : 'Unknown error' });
      } finally {
        setIsLoading(false);
      }
    };

    checkSupport();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-sm">
        <div className="text-white text-sm">🔍 Проверка поддержки...</div>
      </div>
    );
  }

  if (!supportInfo) {
    return null;
  }

  const getStatusColor = (supported: boolean) => supported ? 'text-green-400' : 'text-red-400';
  const getStatusIcon = (supported: boolean) => supported ? '✅' : '❌';

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/90 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-sm max-h-96 overflow-y-auto">
      <h3 className="text-white font-bold mb-3 text-sm">📱 Invoice Support Info</h3>
      
      <div className="space-y-2 text-xs text-white">
        <div>
          <span className="font-semibold">Telegram WebApp:</span>
          <span className={getStatusColor(supportInfo.telegramWebApp)}>
            {getStatusIcon(supportInfo.telegramWebApp)} {supportInfo.telegramWebApp ? 'Available' : 'Not Available'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">WebApp Version:</span>
          <span className="text-blue-400"> {supportInfo.webAppVersion}</span>
        </div>
        
        <div>
          <span className="font-semibold">Platform:</span>
          <span className="text-blue-400"> {supportInfo.platform}</span>
        </div>
        
        <div>
          <span className="font-semibold">TMA SDK:</span>
          <span className={getStatusColor(supportInfo.tmaSDK)}>
            {getStatusIcon(supportInfo.tmaSDK)} {supportInfo.tmaSDK ? 'Supported' : 'Not Supported'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">webApp.openInvoice:</span>
          <span className={getStatusColor(supportInfo.webAppOpenInvoice)}>
            {getStatusIcon(supportInfo.webAppOpenInvoice)} {supportInfo.webAppOpenInvoice ? 'Available' : 'Not Available'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">mainButton.showInvoice:</span>
          <span className={getStatusColor(supportInfo.mainButtonShowInvoice)}>
            {getStatusIcon(supportInfo.mainButtonShowInvoice)} {supportInfo.mainButtonShowInvoice ? 'Available' : 'Not Available'}
          </span>
        </div>
        
        <div>
          <span className="font-semibold">Any Invoice Method:</span>
          <span className={getStatusColor(supportInfo.hasAnyInvoiceMethod)}>
            {getStatusIcon(supportInfo.hasAnyInvoiceMethod)} {supportInfo.hasAnyInvoiceMethod ? 'Available' : 'Not Available'}
          </span>
        </div>
        
        <div className="pt-2 border-t border-white/20">
          <span className="font-semibold">User Agent:</span>
          <div className="text-xs text-gray-400 break-all mt-1">
            {supportInfo.userAgent}
          </div>
        </div>
        
        <div className="pt-2 border-t border-white/20">
          <span className="font-semibold">Timestamp:</span>
          <div className="text-xs text-gray-400">
            {supportInfo.timestamp}
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t border-white/20">
        <button
          onClick={() => setSupportInfo(null)}
          className="w-full px-3 py-2 text-xs font-bold rounded-lg bg-gray-600 text-white hover:bg-gray-700"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
};

export default InvoiceSupportInfo; 