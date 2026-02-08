export const environment = {
  production: true,
  apiUrl: 'https://lidajobseek.onrender.com', // UPDATE THIS with your actual Render backend URL
  socialAuth: {
    enabled: false,
    callbackPath: '/auth/social/callback',
    providers: {
      google: { enabled: false, clientId: '' },
      linkedin: { enabled: false, clientId: '' },
      facebook: { enabled: false, clientId: '' },
    },
  },
};
