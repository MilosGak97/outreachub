export enum UserStatus {
    DELETED = 'DELETED',
    SCHEDULED_DELETE = 'SCHEDULED_DELETE',
    SUSPENDED = 'SUSPENDED', // Email is verified, password setted up, but suspended
    ACTIVE = 'ACTIVE', // After setting up the password
   NO_PASSWORD = 'NO_PASSWORD', // Email is verified but password is not setted up yet
    NEW_REGISTER = 'NEW_REGISTER', // User is registered, but email not verified
}