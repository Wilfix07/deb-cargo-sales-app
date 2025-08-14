import React, { useState } from 'react';
import { Database, CheckCircle, AlertCircle, RefreshCw, Shield, Table, Users, Package } from 'lucide-react';
import { DatabaseSetupService } from '../services/databaseSetup';
import { MobileCard } from './MobileCard';

export const DatabaseSetup: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [verificationResults, setVerificationResults] = useState<{ success: boolean; tables: string[] } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [setupStep, setSetupStep] = useState<string>('');

  const databaseService = new DatabaseSetupService();

  // Full database setup is now handled via Supabase migrations.
  // Use the Verify button below to check your schema after running migrations.

  const handleVerifyOnly = async () => {
    setIsRunning(true);
    setSetupStep('Verifying database...');
    
    try {
      const verification = await databaseService.verifyDatabaseSetup();
      setVerificationResults(verification);
      setSetupStep('Verification complete');
    } catch (error) {
      setVerificationResults({
        success: false,
        tables: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      setSetupStep('Verification failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleCreateSampleData = async () => {
    setIsRunning(true);
    setSetupStep('Creating sample data...');
    
    try {
      await Promise.all([
        databaseService.createSampleSalesRecords(),
        databaseService.createSampleStockMovements()
      ]);
      setSetupStep('Sample data created successfully!');
    } catch (error) {
      setSetupStep('Failed to create sample data');
    } finally {
      setIsRunning(false);
    }
  };

  const requiredTables = [
    { name: 'users', description: 'User accounts and authentication' },
    { name: 'sales_records', description: 'Sales transaction records' },
    { name: 'products', description: 'Product catalog and inventory' },
    { name: 'categories', description: 'Product categories' },
    { name: 'suppliers', description: 'Supplier information' },
    { name: 'stock_movements', description: 'Inventory movement tracking' },
    { name: 'purchase_orders', description: 'Purchase orders to suppliers' },
    { name: 'purchase_order_items', description: 'Items in purchase orders' }
  ];

  return (
    <div className="space-y-6">
      <MobileCard>
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Database className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Database Setup</h2>
          <p className="text-gray-600 mb-6">
            Konfigire ak kreye tablo yo ak relasyon yo nan Supabase database ou an
          </p>

          {isRunning && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-blue-800 text-sm font-medium">{setupStep}</span>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleVerifyOnly}
                disabled={isRunning}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Shield className="w-4 h-4" />
                )}
                <span>Verifye</span>
              </button>

              <button
                onClick={handleCreateSampleData}
                disabled={isRunning}
                className="btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isRunning ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                <span>Done Egzanp</span>
              </button>
            </div>
          </div>
        </div>
      </MobileCard>

      {/* Setup Guidance */}
      <MobileCard>
        <div className="text-sm text-gray-700 space-y-2">
          <p className="font-semibold">Database setup is managed by Supabase migrations.</p>
          <p>Open Supabase Studio → SQL Editor and run the SQL files in the directory: <code>supabase/migrations</code> (from oldest to newest). After applying, click "Verifye" above.</p>
        </div>
      </MobileCard>

      {/* Verification Results */}
      {verificationResults && (
        <MobileCard>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Table className="w-5 h-5 mr-2" />
            Verifikasyon Database
          </h3>
          
          <div className="space-y-3">
            {requiredTables.map((table) => {
              const exists = verificationResults.tables.includes(table.name);
              return (
                <div key={table.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <span className="font-medium text-gray-700">{table.name}</span>
                    <p className="text-xs text-gray-500">{table.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {exists ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-green-600 text-sm font-medium">Egziste</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <span className="text-red-600 text-sm font-medium">Manke</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {verificationResults.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{verificationResults.error}</p>
            </div>
          )}

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <strong>Estatistik:</strong> {verificationResults.tables.length} nan {requiredTables.length} tablo yo egziste
            </p>
          </div>
        </MobileCard>
      )}

      {/* Instructions */}
      <MobileCard>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Enstriksyon yo</h3>
        <div className="text-sm text-gray-600 space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-blue-600 font-bold text-xs">1</span>
            </div>
            <div>
              <p className="font-medium">Konfigire Database Konplè</p>
              <p className="text-xs text-gray-500">Kreye tout tablo yo, relasyon yo, ak done egzanp yo</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 font-bold text-xs">2</span>
            </div>
            <div>
              <p className="font-medium">Verifye Database</p>
              <p className="text-xs text-gray-500">Tcheke si tout tablo yo egziste deja</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-purple-600 font-bold text-xs">3</span>
            </div>
            <div>
              <p className="font-medium">Done Egzanp</p>
              <p className="text-xs text-gray-500">Ajoute vant ak mouvman stock egzanp yo</p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>⚠️ Enpòtan:</strong> Asire w ke ou gen otorizasyon Admin nan Supabase project ou an ak ke environment variables yo konfigire kòrèkteman.
          </p>
        </div>

        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 text-sm">
            <strong>✅ Karaktè yo:</strong>
          </p>
          <ul className="text-xs text-green-700 mt-1 list-disc list-inside space-y-1">
            <li>Kreye tablo yo ak sekirite (IF NOT EXISTS)</li>
            <li>Konfigire Row Level Security (RLS)</li>
            <li>Etabli relasyon ak foreign keys</li>
            <li>Ajoute index yo pou pèfòmans</li>
            <li>Kreye trigger yo pou updated_at</li>
            <li>Ajoute done egzanp yo pou teste</li>
          </ul>
        </div>
      </MobileCard>

      {/* Database Schema Overview */}
      <MobileCard>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Database className="w-5 h-5 mr-2" />
          Schema Database
        </h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Core Tables
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• users - Kont itilizatè yo</li>
                <li>• sales_records - Dosye vant yo</li>
                <li>• products - Katalòg pwodwi yo</li>
                <li>• categories - Kategori pwodwi yo</li>
              </ul>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center">
                <Package className="w-4 h-4 mr-2" />
                Inventory Tables
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• suppliers - Founisè yo</li>
                <li>• stock_movements - Mouvman stock</li>
                <li>• purchase_orders - Kòmand yo</li>
                <li>• purchase_order_items - Atik kòmand yo</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Karaktè Sekirite</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Row Level Security (RLS) aktive sou tout tablo yo</li>
              <li>• Otorizasyon baze sou wòl itilizatè yo</li>
              <li>• Teller yo ka wè sèlman pwòp vant yo</li>
              <li>• Admin ak Manager yo gen aksè konplè</li>
              <li>• Chef Teller yo ka wè tout vant yo men pa ka efase</li>
            </ul>
          </div>
        </div>
      </MobileCard>
    </div>
  );
};