import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { CONFIG } from '../config/appConfig';

/**
 * Web Client ID for Google Sign-In
 * 
 * The WEB_CLIENT_ID is now loaded from src/config/appConfig.ts
 * 
 * To configure:
 * 1. Copy src/config/appConfig.local.example.ts to src/config/appConfig.local.ts
 * 2. Add your Web Client ID to the local config file
 * 
 * To find your Web Client ID:
 * 1. Go to Firebase Console: https://console.firebase.google.com/
 * 2. Select your project: kodex-2962d
 * 3. Go to Project Settings (gear icon) → General tab
 * 4. Scroll to "Your apps" section
 * 5. Click on your Web app (the one you just created)
 * 6. Look for "OAuth client IDs" section
 * 7. Copy the "Web client" ID (it ends with .apps.googleusercontent.com)
 * 
 * OR
 * 
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Select project: kodex-2962d
 * 3. Go to APIs & Services → Credentials
 * 4. Find "OAuth 2.0 Client IDs"
 * 5. Look for the one with type "Web client"
 * 6. Copy the Client ID
 */

export const configureGoogleSignIn = () => {
  const WEB_CLIENT_ID = CONFIG.GOOGLE_WEB_CLIENT_ID;
  
  if (!WEB_CLIENT_ID || WEB_CLIENT_ID.startsWith('REPLACE_WITH')) {
    console.warn(
      '[GoogleSignIn] WEB_CLIENT_ID is not set. Create src/config/appConfig.local.ts with your Web Client ID to enable Google authentication.',
    );
    return;
  }

  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    offlineAccess: false,
    forceCodeForRefreshToken: false,
  });
};

