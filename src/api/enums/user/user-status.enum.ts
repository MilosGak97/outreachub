export enum UserStatus {
    DELETED = 'DELETED',
    SCHEDULED_DELETE = 'SCHEDULED_DELETE',
    SUSPENDED = 'SUSPENDED', // Email is verified, password setted up, but suspended
    ACTIVE = 'ACTIVE', // After setting up the password
    NEW_REGISTER = 'NEW_REGISTER', // User is registered, but email not verified
}
