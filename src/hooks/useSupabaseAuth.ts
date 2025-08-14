import { useState, useEffect } from 'react';
import { SupabaseAuthService } from '../services/supabaseAuth';
import { SupabaseSalesService } from '../services/supabaseSales';
import { User, AuthState, UserRole } from '../types';

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  const [authError, setAuthError] = useState<string | null>(null);

  // Initialize services
  const authService = new SupabaseAuthService();
  const salesService = new SupabaseSalesService();

  // Check for existing user session on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          setAuthState({
            isAuthenticated: true,
            user: {
              id: currentUser.id,
              username: currentUser.username,
              email: currentUser.email,
              fullName: currentUser.fullName,
              role: currentUser.role,
              isActive: currentUser.isActive,
              createdAt: new Date(currentUser.createdAt),
              lastLogin: currentUser.lastLogin ? new Date(currentUser.lastLogin) : undefined
            },
            loading: false
          });
        } else {
          // Clear any stale authentication tokens
          await authService.logout();
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear any stale authentication tokens on error
        await authService.logout();
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (username: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    setAuthError(null);

    console.log('Hook: Starting login for:', username);

    try {
      const result = await authService.login({ username, password });
      
      if (result.success && result.user) {
        console.log('Hook: Login successful');
        const user: User = {
          id: result.user.id,
          username: result.user.username,
          email: result.user.email,
          fullName: result.user.fullName,
          role: result.user.role,
          isActive: result.user.isActive,
          createdAt: new Date(result.user.createdAt),
          lastLogin: result.user.lastLogin ? new Date(result.user.lastLogin) : undefined
        };

        authService.saveUserToStorage(result.user);
        
        setAuthState({
          isAuthenticated: true,
          user,
          loading: false
        });
      } else {
        console.log('Hook: Login failed:', result.error);
        setAuthError(result.error || 'Login echwe - erè enkoni');
        setAuthState(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Hook: Unexpected login error:', error);
      setAuthError('Erè inatandi nan koneksyon. Verifye koneksyon entènèt ou ak eseye ankò.');
      setAuthState(prev => ({ ...prev, loading: false }));
    }
  };

  const register = async (username: string, email: string, fullName: string, password: string, role: UserRole) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    setAuthError(null);

    console.log('Hook: Starting registration for:', username);

    try {
      const result = await authService.register({ username, email, fullName, password, role });
      
      if (result.success && result.user) {
        console.log('Hook: Registration successful');
        
        // Don't automatically log in the user after registration
        // They should be redirected to login page to explicitly log in
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
        
        return { success: true };
      } else {
        console.log('Hook: Registration failed:', result.error);
        setAuthError(result.error || 'Rejistrasyon echwe - erè enkoni');
        setAuthState(prev => ({ ...prev, loading: false }));
        return { success: false };
      }
    } catch (error) {
      console.error('Hook: Unexpected registration error:', error);
      setAuthError('Erè inatandi nan kreyasyon kont la. Verifye koneksyon entènèt ou ak eseye ankò.');
      setAuthState(prev => ({ ...prev, loading: false }));
      return { success: false };
    }
  };

  const logout = async () => {
    await authService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
    setAuthError(null);
  };

  const clearError = () => {
    setAuthError(null);
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    
    try {
      const result = await authService.resetPassword(email);
      return result;
    } catch (error) {
      console.error('Hook: Password reset error:', error);
      setAuthError('Erè inatandi nan reset modpas la. Eseye ankò.');
      return { success: false };
    }
  };

  const updatePassword = async (newPassword: string) => {
    setAuthError(null);
    
    try {
      const result = await authService.updatePassword(newPassword);
      return result;
    } catch (error) {
      console.error('Hook: Password update error:', error);
      setAuthError('Erè inatandi nan chanje modpas la. Eseye ankò.');
      return { success: false };
    }
  };

  return {
    ...authState,
    login,
    register,
    logout,
    error: authError,
    clearError,
    salesService,
    resetPassword,
    updatePassword
  };
}