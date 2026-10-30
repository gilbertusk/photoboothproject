import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('backend has Booking model and controller', () => {
  const model = read('backend/src/models/booking.model.ts')
  const controller = read('backend/src/controllers/booking.controller.ts')

  assert.match(model, /export const Booking = mongoose.model/)
  assert.match(controller, /export const createBooking/)
  assert.match(controller, /export const getBookings/)
  assert.match(controller, /export const getBookingById/)
  assert.match(controller, /export const getAvailableSlots/)
  assert.match(controller, /export const updateBookingPayment/)
})

test('backend exposes public booking routes', () => {
  const source = read('backend/src/routes/booking.routes.ts')

  assert.match(source, /router\.post\(['"]\/['"], createBooking\)/)
  assert.match(source, /router\.get\(['"]\/available-slots['"], getAvailableSlots\)/)
  assert.match(source, /router\.get\(['"]\/:id['"], getBookingById\)/)
})

test('booking route is registered in backend index', () => {
  const source = read('backend/src/index.ts')
  assert.match(source, /app\.use\(['"]\/api\/bookings['"], bookingRoutes\)/)
})

test('backend has Testimonial model and controller', () => {
  const model = read('backend/src/models/testimonial.model.ts')
  const controller = read('backend/src/controllers/testimonial.controller.ts')

  assert.match(model, /export const Testimonial = mongoose.model/)
  assert.match(controller, /export const createTestimonial/)
  assert.match(controller, /export const getTestimonials/)
  assert.match(controller, /export const getTestimonialById/)
})

test('backend exposes public testimonial routes', () => {
  const source = read('backend/src/routes/testimonial.routes.ts')

  assert.match(source, /router\.get\(['"]\/['"], getTestimonials\)/)
  assert.match(source, /router\.get\(['"]\/:id['"], getTestimonialById\)/)
})

test('testimonial route is registered in backend index', () => {
  const source = read('backend/src/index.ts')
  assert.match(source, /app\.use\(['"]\/api\/testimonials['"], testimonialRoutes\)/)
})

test('frontend types include Booking and Testimonial', () => {
  const source = read('photobooth-app/src/types/index.ts')

  assert.match(source, /export interface Booking/)
  assert.match(source, /export interface Testimonial/)
})

test('App routes include public pages (pricing, booking, testimonial)', () => {
  const source = read('photobooth-app/src/App.tsx')

  assert.match(source, /PricingPage/)
  assert.match(source, /BookingPage/)
  assert.match(source, /TestimonialPage/)
  assert.match(source, /PublicLayout/)
  assert.match(source, /\/pricing/)
  assert.match(source, /\/booking/)
  assert.match(source, /\/testimonial/)
})

test('PricingPage fetches public packages', () => {
  const source = read('photobooth-app/src/screens/PricingPage.tsx')

  assert.match(source, /\/api\/public\/packages/)
  assert.match(source, /PricingPackage/)
})

test('BookingPage submits booking and checks available slots', () => {
  const source = read('photobooth-app/src/screens/BookingPage.tsx')

  assert.match(source, /\/api\/bookings/)
  assert.match(source, /\/api\/bookings\/available-slots/)
  assert.match(source, /customerName/)
  assert.match(source, /customerEmail/)
  assert.match(source, /customerPhone/)
  assert.match(source, /eventDate/)
  assert.match(source, /eventTime/)
})

test('TestimonialPage fetches public testimonials', () => {
  const source = read('photobooth-app/src/screens/TestimonialPage.tsx')

  assert.match(source, /\/api\/testimonials/)
  assert.match(source, /Testimonial/)
})

test('PublicLayout exists for public pages', () => {
  const source = read('photobooth-app/src/components/layout/PublicLayout.tsx')

  assert.match(source, /export function PublicLayout/)
})
