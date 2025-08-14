import React, { useState } from 'react';
import { LogIn, User, Lock, UserPlus, Eye, EyeOff, Mail } from 'lucide-react';
import { Logo } from './Logo';
import { UserRole } from '../types';

interface LoginFormProps {
  onLogin: (username: string, password: string) => Promise<void>;
  onSwitchToRegister: () => void;
  onResetPassword?: (email: string) => Promise<{ success: boolean; error?: string }>;
  loading: boolean;
  error: string | null;
  userRole?: UserRole;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onLogin, 
  onSwitchToRegister, 
  onResetPassword,
  loading, 
  error,
  userRole
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Non itilizatè a obligatwa';
    }
    
    if (!formData.password) {
      errors.password = 'Modpas la obligatwa';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('Form: Submitting login for:', formData.username);
    await onLogin(formData.username, formData.password);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setResetMessage({ type: 'error', message: 'Tanpri antre email ou an' });
      return;
    }

    if (!onResetPassword) {
      setResetMessage({ type: 'error', message: 'Fonksyon reset modpas la pa disponib' });
      return;
    }

    setResetLoading(true);
    setResetMessage(null);

    const result = await onResetPassword(resetEmail);
    
    if (result.success) {
      setResetMessage({ 
        type: 'success', 
        message: 'Yon email ak enstriksyon yo voye nan adrès email ou an. Verifye email ou an (ak spam folder a tou).' 
      });
      setResetEmail('');
    } else {
      setResetMessage({ 
        type: 'error', 
        message: result.error || 'Erè nan voye email reset la' 
      });
    }
    
    setResetLoading(false);
  };

  if (showResetForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mx-2 sm:mx-0">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
            <div className="flex justify-center mb-4">
              <Logo size="large" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">DEB CARGO SHIPPING LLC</h1>
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Reset Modpas</h2>
            <p className="text-blue-100 text-sm sm:text-base">Antre email ou an pou reset modpas ou</p>
          </div>

          <div className="p-6 sm:p-8">
            <button
              onClick={() => {
                setShowResetForm(false);
                setResetMessage(null);
                setResetEmail('');
              }}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4"
            >
              ← Retounen nan Login
            </button>

            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Reset Modpas ou</h2>
            
            {resetMessage && (
              <div className={`mb-4 p-3 rounded-lg ${
                resetMessage.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <p className="text-sm">{resetMessage.message}</p>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base"
                    placeholder="Antre email ou"
                    disabled={resetLoading}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Ap voye email...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    <span>Voye Email Reset</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mx-2 sm:mx-0">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">DEB CARGO SHIPPING LLC</h1>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Sales Data Collection</h2>
          <p className="text-blue-100 text-sm sm:text-base">
            {userRole === 'Teller' ? 'Sistèm Koleksyon Done Vant' : 'Sales Data Collection System'}
          </p>
        </div>

        <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {userRole === 'Teller' ? 'Konekte nan Kont ou' : 'Sign In to Your Account'}
          </h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {userRole === 'Teller' ? 'Non Itilizatè' : 'Username'}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base bg-white text-gray-900 ${
                    formErrors.username ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={userRole === 'Teller' ? 'Antre non itilizatè ou' : 'Enter your username'}
                  disabled={loading}
                />
              </div>
              {formErrors.username && (
                <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {userRole === 'Teller' ? 'Modpas' : 'Password'}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base bg-white text-gray-900 ${
                    formErrors.password ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={userRole === 'Teller' ? 'Antre modpas ou' : 'Enter your password'}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{userRole === 'Teller' ? 'Ap konekte...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>{userRole === 'Teller' ? 'Konekte' : 'Sign In'}</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setShowResetForm(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              disabled={loading}
            >
              {userRole === 'Teller' ? 'Bliye modpas ou?' : 'Forgot your password?'}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              {userRole === 'Teller' ? 'Ou pa gen kont?' : "Don't have an account?"}{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-blue-600 hover:text-blue-700 font-semibold"
                disabled={loading}
              >
                {userRole === 'Teller' ? 'Kreye yon kont' : 'Create an account'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};