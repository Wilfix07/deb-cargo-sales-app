import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  fullName: string;
  password: string;
  role?: UserRole;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export class SupabaseAuthService {
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      console.log('Starting login process for username:', credentials.username);
      
      // Get user by username to find their email
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', credentials.username)
        .limit(1);

      if (fetchError) {
        console.error('Database error during user lookup:', fetchError.message, fetchError);
        return { success: false, error: 'Erè nan koneksyon ak database la' };
      }

      if (!users || users.length === 0) {
        console.log('User not found in database:', credentials.username);
        return { success: false, error: 'Non itilizatè oswa modpas la pa kòrèk' };
      }

      const userRecord = users[0];
      console.log('User found in database, checking if active...');
      
      // Check if user is active
      if (!userRecord.is_active) {
        console.log('User account is inactive:', credentials.username);
        return { success: false, error: user?.role === 'Teller' ? 'Kont ou an pa aktif. Kontakte administratè a.' : 'Your account is inactive. Contact the administrator.' };
      }

      console.log('Attempting Supabase auth login...');
      // Use Supabase Auth to sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: userRecord.email,
        password: credentials.password,
      });

      if (authError) {
        console.error('Supabase auth error:', authError.message, authError);
        if (authError.message.includes('Invalid login credentials')) {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
        return { success: false, error: 'Incorrect username or password' };
      }

      if (!authData.user) {
        console.log('No auth user returned from login');
        return { success: false, error: 'Incorrect username or password' };
      }

      console.log('Auth login successful, updating last login...');
      // Update last login
      const { error: updateError } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userRecord.id);

      if (updateError) {
        console.warn('Failed to update last login:', updateError.message);
        // Don't fail the login for this
      }

      const userData: UserData = {
        id: userRecord.id,
        username: userRecord.username,
        email: userRecord.email,
        fullName: userRecord.full_name,
        role: userRecord.role,
        isActive: userRecord.is_active,
        createdAt: userRecord.created_at,
        lastLogin: new Date().toISOString()
      };

      console.log('Login successful for user:', userData.username);
      return { success: true, user: userData };

    } catch (error) {
      console.error('Unexpected login error:', error);
      return { success: false, error: 'Connection error. Please try again.' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: UserData; error?: string }> {
    try {
      console.log('Starting registration process for:', data.username);
      
      // Normalize email to prevent case sensitivity and whitespace issues
      const normalizedEmail = data.email.toLowerCase().trim();
      
      // Check if username already exists
      const { data: existingUsername } = await supabase
        .from('users')
        .select('id')
        .eq('username', data.username)
        .limit(1);

      if (existingUsername && existingUsername.length > 0) {
        console.log('Username already exists:', data.username);
        return { success: false, error: 'This username already exists' };
      }

      // Check if email already exists
      const { data: existingEmail } = await supabase
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .limit(1);

      if (existingEmail && existingEmail.length > 0) {
        console.log('Email already exists:', normalizedEmail);
        return { success: false, error: 'This email is already in use' };
      }

      console.log('Creating auth user...');
      // Use Supabase Auth to create the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          data: {
            username: data.username,
            full_name: data.fullName,
            role: data.role || 'Teller'
          }
        }
      });

      if (authError) {
        console.error('Auth signup error:', authError.message, authError);
        if (authError.message.includes('already registered')) {
          return { success: false, error: 'This email is already in use' };
        }
        if (authError.message.includes('Database error saving new user')) {
          return { success: false, error: 'Database error: Check if RLS is blocking user creation. Contact administrator.' };
        }
        return { success: false, error: 'Supabase Auth Error: ' + authError.message };
      }

      if (!authData.user) {
        console.log('No user returned from auth signup');
        return { success: false, error: 'Error creating account' };
      }

      console.log('Auth user created, creating profile...');
      // Create the user profile manually since we disabled RLS
      const { data: newUser, error: upsertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          username: data.username,
          email: normalizedEmail,
          full_name: data.fullName,
          role: data.role || 'Teller',
          is_active: true,
          created_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (upsertError) {
        console.error('Profile creation error:', upsertError.message, upsertError);
        // Clean up auth user if profile creation fails
        try {
          await supabase.auth.signOut();
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError);
        }
        
        if (upsertError.message.includes('duplicate key')) {
          return { success: false, error: 'This username or email already exists' };
        }
        if (upsertError.message.includes('permission denied') || upsertError.message.includes('RLS')) {
          return { success: false, error: 'Authorization error: RLS may be blocking access to users table. Contact administrator.' };
        }
        return { success: false, error: 'Error creating profile: ' + upsertError.message };
      }

      console.log('User profile created successfully');
      
      // Log out the user immediately after successful registration
      // so they need to explicitly log in with their new credentials
      await supabase.auth.signOut();
      
      const userData: UserData = {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        fullName: newUser.full_name,
        role: newUser.role,
        isActive: newUser.is_active,
        createdAt: newUser.created_at
      };

      return { success: true, user: userData };

    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Error creating account. Please try again.' };
    }
  }

  async getCurrentUser(): Promise<UserData | null> {
    try {
      // Get current auth user  
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser) {
        return null;
      }

      // Get user profile
      const { data: userProfiles, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .limit(1);

      if (profileError || !userProfiles || userProfiles.length === 0) {
        console.error('Profile fetch error:', profileError?.message || 'No profile found');
        // If no profile found but auth user exists, this might be an RLS issue
        if (!profileError && userProfiles.length === 0) {
          console.error('RLS Policy Issue: User profile not found despite valid auth user. Check RLS policies on users table.');
        }
        return null;
      }

      const userProfile = userProfiles[0];

      return {
        id: userProfile.id,
        username: userProfile.username,
        email: userProfile.email,
        fullName: userProfile.full_name,
        role: userProfile.role,
        isActive: userProfile.is_active,
        createdAt: userProfile.created_at,
        lastLogin: userProfile.last_login
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
    localStorage.removeItem('currentUser');
  }

  saveUserToStorage(user: UserData): void {
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Starting password reset for email:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        console.error('Password reset error:', error.message, error);
        if (error.message.includes('Email not confirmed')) {
          return { success: false, error: 'Email not confirmed. Please verify your email and confirm your account before trying to reset password.' };
        }
        if (error.message.includes('User not found')) {
          return { success: false, error: 'No account found with this email.' };
        }
        return { success: false, error: 'Error sending password reset email' };
      }

      console.log('Password reset email sent successfully');
      return { success: true };

    } catch (error) {
      console.error('Unexpected password reset error:', error);
      return { success: false, error: 'Unexpected error resetting password. Please try again.' };
    }
  }

  async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating password...');
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error.message, error);
        return { success: false, error: 'Error updating password' };
      }

      console.log('Password updated successfully');
      return { success: true };

    } catch (error) {
      console.error('Unexpected password update error:', error);
      return { success: false, error: 'Unexpected error updating password. Please try again.' };
    }
  }
}