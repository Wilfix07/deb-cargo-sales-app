import React, { useState, useEffect } from 'react';
import { Settings, Shield, AlertTriangle, CheckCircle, Save } from 'lucide-react';
import { SupabaseSalesService } from '../../services/supabaseSales';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

export const StockSettings: React.FC = () => {
  const [allowNegativeStock, setAllowNegativeStock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { user, salesService } = useSupabaseAuth();

  useEffect(() => {
    // Load current setting
    if (salesService) {
      setAllowNegativeStock(salesService.getAllowNegativeStock());
    }
  }, [salesService]);

  const handleSaveSettings = async () => {
    if (!salesService) return;

    setLoading(true);
    setMessage(null);

    try {
      salesService.setAllowNegativeStock(allowNegativeStock);
      
      setMessage({
        type: 'success',
        text: 'Paramèt stock yo sove ak siksè'
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Erè nan sove paramèt yo'
      });
    } finally {
      setLoading(false);
    }
  };

  // Only allow Admin users to change these settings
  if (!user || user.role !== 'Admin') {
    return (
      <div className="mobile-card text-center py-8">
        <Shield className="w-12 h-12 text-red-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-red-600 mb-2">Aksè Refize</h3>
        <p className="text-red-500">Sèlman Admin yo ki ka modifye paramèt stock yo</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mobile-card">
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Paramèt Stock</h2>
            <p className="text-gray-600 text-sm">Konfigire konpòtman jesyon stock la</p>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">{message.text}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* Negative Stock Setting */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  id="allowNegativeStock"
                  checked={allowNegativeStock}
                  onChange={(e) => setAllowNegativeStock(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="allowNegativeStock" className="font-semibold text-gray-800 cursor-pointer">
                  Otorize Stock Negatif
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  Pèmèt vant yo kontinye menm lè stock la pa ase. Stock la ap vin 0 ak yon dosye shortage ap kreye.
                </p>
                
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Atansyon:</strong> Lè ou aktive opsyon sa a, sistèm nan ap pèmèt vant yo menm si stock la pa ase. 
                    Yon dosye "stock shortage\" ap kreye pou chak ka konsa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Behavior Explanation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Konpòtman Aktyèl</h3>
            <div className="text-sm text-blue-700 space-y-2">
              {allowNegativeStock ? (
                <>
                  <p>✅ <strong>Stock Negatif Otorize:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Vant yo ap aksepte menm si stock la pa ase</li>
                    <li>Stock la ap vin 0 otomatikman</li>
                    <li>Yon dosye "shortage" ap kreye pou audit</li>
                    <li>Sistèm nan ap kontinye fonksyone san entèripsyon</li>
                  </ul>
                </>
              ) : (
                <>
                  <p>🛡️ <strong>Stock Negatif Entèdi:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Vant yo ap refize si stock la pa ase</li>
                    <li>Mesaj erè ap parèt pou itilizatè a</li>
                    <li>Stock la ap rete pozitif tout tan</li>
                    <li>Pwoteksyon kont overselling</li>
                  </ul>
                </>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveSettings}
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Sove Paramèt yo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mobile-card">
        <h3 className="font-semibold text-gray-800 mb-3">Enfòmasyon Adisyonèl</h3>
        <div className="text-sm text-gray-600 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">1</span>
            </div>
            <div>
              <p className="font-medium">Jesyon Stock Otomatik</p>
              <p className="text-xs text-gray-500">Stock la ap diminye otomatikman apre chak vant</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 font-bold text-xs">2</span>
            </div>
            <div>
              <p className="font-medium">Dosye Mouvman</p>
              <p className="text-xs text-gray-500">Chak vant ap kreye yon dosye mouvman stock pou audit</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600 font-bold text-xs">3</span>
            </div>
            <div>
              <p className="font-medium">Pwoteksyon Kont Race Conditions</p>
              <p className="text-xs text-gray-500">Database locks ak transactions pou evite konfli</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};