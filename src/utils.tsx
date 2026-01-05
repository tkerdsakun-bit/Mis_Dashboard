// ==========================================
// Utils Functions สำหรับ IT Asset Management
// ==========================================

import { supabase } from './supabaseClient';

// ==========================================
// 1. Avatar Upload Handler
// ==========================================

export const handleAvatarUpload = async (
  event: React.ChangeEvent<HTMLInputElement>,
  currentUserId: number,
  setUploading: (loading: boolean) => void
): Promise<boolean> => {
  const file = event.target.files?.[0];
  if (!file) return false;

  // Validate file type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    alert('❌ รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น');
    return false;
  }

  // Validate file size (2MB max)
  if (file.size > 2 * 1024 * 1024) {
    alert('❌ ขนาดไฟล์ต้องไม่เกิน 2MB');
    return false;
  }

  setUploading(true);

  try {
    // Create unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `avatar-${currentUserId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('assets')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update user avatar in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: avatarUrl, updated_at: new Date().toISOString() })
      .eq('id', currentUserId);

    if (updateError) throw updateError;

    alert('✅ อัพเดตรูปโปรไฟล์สำเร็จ!');

    // Reload page to show new avatar
    window.location.reload();

    return true;

  } catch (error: any) {
    console.error('Avatar upload error:', error);
    alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    return false;
  } finally {
    setUploading(false);
  }
};

// ==========================================
// 2. Settings Management
// ==========================================

export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'th' | 'en';
  notifications: boolean;
  emailNotif: boolean;
  autoBackup: boolean;
  itemsPerPage: string;
}

export const saveSettings = async (
  settings: AppSettings,
  currentUserId: number
): Promise<boolean> => {
  try {
    // Save to localStorage
    localStorage.setItem('app_settings', JSON.stringify(settings));

    // Apply theme
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');

    // Optionally save to database
    const { error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: currentUserId,
        settings: settings,
        updated_at: new Date().toISOString()
      });

    if (error) console.warn('Settings save warning:', error);

    alert('✅ บันทึกการตั้งค่าสำเร็จ!');
    return true;
  } catch (error: any) {
    console.error('Save settings error:', error);
    alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    return false;
  }
};

export const loadSettings = (): AppSettings | null => {
  const savedSettings = localStorage.getItem('app_settings');
  if (savedSettings) {
    try {
      return JSON.parse(savedSettings);
    } catch (error) {
      console.error('Load settings error:', error);
      return null;
    }
  }
  return null;
};

export const applyTheme = (theme: 'light' | 'dark') => {
  document.documentElement.classList.toggle('dark', theme === 'dark');
};

// ==========================================
// 3. Profile Update Handler
// ==========================================

export interface ProfileData {
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  bio: string;
}

export const updateProfile = async (
  profileData: ProfileData,
  currentUserId: number
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        position: profileData.position,
        department: profileData.department,
        bio: profileData.bio,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentUserId);

    if (error) throw error;

    alert('✅ บันทึกข้อมูลโปรไฟล์สำเร็จ!');
    return true;
  } catch (error: any) {
    console.error('Update profile error:', error);
    alert('❌ เกิดข้อผิดพลาด: ' + error.message);
    return false;
  }
};

// ==========================================
// 4. File Validation Utilities
// ==========================================

export const validateImageFile = (file: File): { valid: boolean; error?: string } => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'รองรับเฉพาะไฟล์ JPG, PNG, WEBP เท่านั้น' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 2MB' };
  }

  return { valid: true };
};

// ==========================================
// Export ทั้งหมด
// ==========================================

export default {
  handleAvatarUpload,
  saveSettings,
  loadSettings,
  applyTheme,
  updateProfile,
  validateImageFile
};
