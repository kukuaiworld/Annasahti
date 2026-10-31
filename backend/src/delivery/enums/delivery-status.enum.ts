/**
 * Matches database enum public.delivery_status:
 * ('assigned', 'accepted', 'pickup_confirmed', 'in_transit', 'delivered', 'failed', 'cancelled')
 */
export enum DeliveryStatus {
  ASSIGNED = 'assigned',
  ACCEPTED = 'accepted',
  PICKUP_CONFIRMED = 'pickup_confirmed',
  IN_TRANSIT = 'in_transit',
  DELIVERED = 'delivered',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}
