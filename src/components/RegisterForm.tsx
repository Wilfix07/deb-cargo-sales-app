import React, { useState } from 'react';
import { UserPlus, User, Mail, Lock, FileText, ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react';
import { Logo } from './Logo';
import { MobileFormContainer } from './MobileFormContainer';
import { UserRole } from '../types';

interface RegisterFormProps {
  onRegister: (username: string, email: string, fullName: string, password: string, role: UserRole) => Promise<void>;
  onSwitchToLogin: () => void;
  loading: boolean;
  error: string | null;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onRegister, 
  onSwitchToLogin, 
  loading, 
  error 
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);


  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Non itilizatè a obligatwa';
    } else if (formData.username.length < 3) {
      errors.username = 'Non itilizatè a dwe gen omwen 3 karaktè';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email la obligatwa';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email la pa valid';
    }
    
    if (!formData.fullName.trim()) {
      errors.fullName = 'Non konplè a obligatwa';
    }
    
    if (!formData.password) {
      errors.password = 'Modpas la obligatwa';
    } else if (formData.password.length < 6) {
      errors.password = 'Modpas la dwe gen omwen 6 karaktè';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Modpas yo pa menm';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('Form: Submitting registration for:', formData.username);
    await onRegister(formData.username, formData.email, formData.fullName, formData.password, 'Teller');
    // After successful registration, go back to Login
    onSwitchToLogin();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <MobileFormContainer
      title="Kreye Nouvo Kont"
      onClose={onSwitchToLogin}
      enableSwipeNavigation={true}
      scrollToTopOnMount={true}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <div className="mobile-form">
        <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center rounded-2xl mb-6">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">DEB CARGO SHIPPING LLC</h1>
          <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Kreye Nouvo Kont</h2>
          <p className="text-green-100 text-sm sm:text-base">Create New Account</p>
        </div>

        <div className="flex items-center mb-6">
          <button
            onClick={onSwitchToLogin}
            className="flex items-center text-gray-600 hover:text-gray-800 transition-colors tap-target"
            disabled={loading}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Login
          </button>
        </div>

        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Create Your Account</h2>
        
        {error && (
          <div className="mobile-alert-error mb-4">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mobile-alert-info mb-4">
          <p className="text-sm">
            <strong>Note:</strong> New accounts are created with "Teller" role by default. An Admin can change your role after your account is created.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="mobile-form-group">
              <label className="mobile-label">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  className={`mobile-input pl-10 ${
                    formErrors.username ? 'border-red-500' : ''
                  }`}
                  placeholder="Choose a username"
                  disabled={loading}
                />
              </div>
              {formErrors.username && (
                <p className="text-red-500 text-sm mt-1">{formErrors.username}</p>
              )}
            </div>

            <div className="mobile-form-group">
              <label className="mobile-label">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`mobile-input pl-10 ${
                    formErrors.email ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              {formErrors.email && (
                <p className="text-red-500 text-sm mt-1">{formErrors.email}</p>
              )}
            </div>

            <div className="mobile-form-group">
              <label className="mobile-label">
                Full Name
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`mobile-input pl-10 ${
                    formErrors.fullName ? 'border-red-500' : ''
                  }`}
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>
              {formErrors.fullName && (
                <p className="text-red-500 text-sm mt-1">{formErrors.fullName}</p>
              )}
            </div>


            <div className="mobile-form-group">
              <label className="mobile-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`mobile-input pl-10 pr-12 ${
                    formErrors.password ? 'border-red-500' : ''
                  }`}
                  placeholder="Create a password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors tap-target"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.password && (
                <p className="text-red-500 text-sm mt-1">{formErrors.password}</p>
              )}
            </div>

            <div className="mobile-form-group">
              <label className="mobile-label">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={`mobile-input pl-10 pr-12 ${
                    formErrors.confirmPassword ? 'border-red-500' : ''
                  }`}
                  placeholder="Confirm your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors tap-target"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{formErrors.confirmPassword}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              )}
            </button>
          </form>
        </div>
      </MobileFormContainer>
  );
};