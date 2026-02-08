export const environment = {
  production: false,
  apiUrl: '', // Uses proxy in development
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
