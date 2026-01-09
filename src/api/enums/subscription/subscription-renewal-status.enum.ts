export enum SubscriptionRenewalStatus{
    NOT_ELIGIBLE = 'NOT_ELIGIBLE', // Renewal not allowed (e.g., expired subscription)
    ELIGIBLE_FOR_DISCOUNT = 'ELIGIBLE_FOR_DISCOUNT', // Eligible for discount (60-30 days before expiration)
    ELIGIBLE_FOR_REGULAR_PRICE = 'ELIGIBLE_FOR_REGULAR_PRICE', // Eligible for renewal at regular price (less than 30 days before expiration)
    RENEWAL_SCHEDULED = 'RENEWAL_SCHEDULED', // Renewal is scheduled for a future date
    RENEWAL_PENDING = 'RENEWAL_PENDING', // Renewal date is here and is scheduled, but payment is not made yet
    RENEWAL_COMPLETED = 'RENEWAL_COMPLETED', // Renewal was successful
    RENEWAL_CANCELED = 'RENEWAL_CANCELED' // Renewal was canceled by the user or not scheduled/initiated

}