import React, { useState } from 'react';
import { format } from 'date-fns';
import { Search, Calendar, Package, User, Trash2, Download, Shield, Edit } from 'lucide-react';
import { SalesRecord, UserRole } from '../types';
import { isToday } from 'date-fns';
import { MobileCard } from './MobileCard';
import { SwipeableCard } from './SwipeableCard';

interface SalesHistoryProps {
  records: SalesRecord[];
  onDeleteRecord: (id: string) => void;
  onEditRecord?: (record: SalesRecord) => void;
  onExportData: () => void;
  canDelete: boolean;
  canExport: boolean;
  userRole?: UserRole;
}

export const SalesHistory: React.FC<SalesHistoryProps> = ({ 
  records, 
  onDeleteRecord, 
  onEditRecord,
  onExportData,
  canDelete,
  canExport,
  userRole
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');

  const filteredRecords = records
    .filter(record => 
      record.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.productCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case 'amount':
          return b.totalAmount - a.totalAmount;
        case 'customer':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

  const canEditRecord = (record: SalesRecord): boolean => {
    if (userRole === 'Admin' || userRole === 'Manager') {
      return true; // Admin ak Manager ka modifye nenpòt vant
    }
    if (userRole === 'Chef Teller') {
      return isToday(new Date(record.timestamp)); // Chef Teller ka modifye sèlman vant jodi a yo
    }
    return false; // Teller pa ka modifye vant yo
  };

  const canDeleteRecord = (record: SalesRecord): boolean => {
    if (!canDelete) return false;
    if (userRole === 'Chef Teller') {
      return isToday(new Date(record.timestamp));
    }
    return true; // Admin/Manager can delete any record
  };
  return (
    <div className="space-y-4 overflow-y-auto">
      {/* Search and Filters */}
      <MobileCard padding="medium">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-600" />
            {userRole === 'Teller' ? 'Istwa Vant' : 'Sales History'}
          </h2>
          
          {canExport && (
            <button
              onClick={onExportData}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
        </div>
        
        <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={userRole === 'Teller' ? 'Chèche vant...' : 'Search sales...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mobile-input pl-10"
              />
            </div>
            
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'customer')}
                className="mobile-input flex-1"
              >
                <option value="date">{userRole === 'Teller' ? 'Klase pa dat' : 'Sort by Date'}</option>
                <option value="amount">{userRole === 'Teller' ? 'Klase pa kantite' : 'Sort by Amount'}</option>
                <option value="customer">{userRole === 'Teller' ? 'Klase pa kliyan' : 'Sort by Customer'}</option>
              </select>
            </div>
        </div>
      </MobileCard>

      {/* Sales Records */}
        {filteredRecords.length === 0 ? (
        <MobileCard className="text-center py-12">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 mb-2">
            {userRole === 'Teller' ? 'Pa gen dosye vant yo' : 'No sales records found'}
          </h3>
          <p className="text-gray-400">
            {userRole === 'Teller' ? 'Kòmanse pa scan yon pwodwi oswa ajoute manual' : 'Start by scanning a product or adding a manual entry'}
          </p>
        </MobileCard>
        ) : (
        <div className="space-y-3">
            {filteredRecords.map((record) => (
            <SwipeableCard
                key={record.id}
              onEdit={canEditRecord(record) && onEditRecord ? () => onEditRecord(record) : undefined}
              onDelete={canDeleteRecord(record) ? () => onDeleteRecord(record.id) : undefined}
              canEdit={canEditRecord(record) && !!onEditRecord}
              canDelete={canDeleteRecord(record)}
              >
              <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {record.productName}
                      </h3>
                      <p className="text-xs text-gray-500">{record.productCode}</p>
                    </div>
                  </div>
                <div className="text-right">
                  <span className="font-bold text-green-600 text-lg">
                    $HT{record.totalAmount.toFixed(2)}
                  </span>
                  </div>
                </div>

              <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {userRole === 'Teller' ? 'Kantite:' : 'Quantity:'}
                  </span>
                    <span className="font-medium">{record.quantity}</span>
                  </div>
                  <div className="flex items-center justify-between">
                  <span className="text-gray-600">
                    {userRole === 'Teller' ? 'Pri inite:' : 'Unit Price:'}
                  </span>
                    <span className="font-medium">$HT{record.unitPrice.toFixed(2)}</span>
                  </div>
                </div>

              <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
                  <div className="flex items-center text-xs text-gray-600">
                    <User className="w-3 h-3 mr-1" />
                    {record.customerName}
                  </div>
                  <div className="text-xs text-gray-500">
                  {format(new Date(record.timestamp), userRole === 'Teller' ? 'dd MMM yyyy • h:mm a' : 'MMM dd, yyyy • h:mm a')}
                  </div>
                  {record.scanType && record.scanType !== 'manual' && (
                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        record.scanType === 'qr' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                      {record.scanType === 'qr' 
                        ? (userRole === 'Teller' ? 'QR Scan' : 'QR Scanned')
                        : (userRole === 'Teller' ? 'Barcode Scan' : 'Barcode Scanned')
                      }
                      </span>
                    </div>
                  )}
                </div>
            </SwipeableCard>
            ))}
          </div>
        )}
    </div>
  );
};