import { describe, expect, it } from 'vitest'
import { buildCityAdConfigFormData, mapBackendCityAdConfig } from './cityAdConfigApi'

describe('mapBackendCityAdConfig', () => {
  it('maps a city slot configuration from the list payload', () => {
    const raw = {
      _id: '6aaa3703dac1e18f5f869b25',
      country: 'Bangladesh',
      countryCode: 'BD',
      city: 'Chatto',
      latitude: 23.8103,
      longitude: 91.4125,
      featuredCapacity: 5,
      featuredEnabled: true,
      featuredPositionPricing: [
        { position: 1, price: 100 },
        { position: 2, price: 80 },
      ],
      defaultFeaturedImage: '/uploads/defaultFeaturedImage/sample.jpeg',
      status: 'active',
      lockVersion: 0,
      isDeleted: false,
    }

    const mapped = mapBackendCityAdConfig(raw)

    expect(mapped.id).toBe('6aaa3703dac1e18f5f869b25')
    expect(mapped.city).toBe('Chatto')
    expect(mapped.countryCode).toBe('BD')
    expect(mapped.featuredCapacity).toBe(5)
    expect(mapped.featuredEnabled).toBe(true)
    expect(mapped.featuredPositionPricing).toEqual([
      { position: 1, price: 100 },
      { position: 2, price: 80 },
    ])
    expect(mapped.defaultFeaturedImage).toBe('/uploads/defaultFeaturedImage/sample.jpeg')
    expect(mapped.status).toBe('active')
  })

  it('defaults missing pricing and image fields', () => {
    const mapped = mapBackendCityAdConfig({
      _id: 'abc',
      city: 'Dhaka',
      featuredPositionPricing: [],
      defaultFeaturedImage: '',
    })

    expect(mapped.featuredPositionPricing).toEqual([])
    expect(mapped.defaultFeaturedImage).toBe('')
    expect(mapped.featuredEnabled).toBe(false)
    expect(mapped.status).toBe('active')
  })
})

describe('buildCityAdConfigFormData', () => {
  it('sends JSON in `data` and the image file as `defaultFeaturedImage`', () => {
    const file = new File(['img'], 'cover.jpeg', { type: 'image/jpeg' })
    const formData = buildCityAdConfigFormData({
      country: 'Bangladesh',
      countryCode: 'BD',
      city: 'Chatto',
      latitude: 23.8103,
      longitude: 91.4125,
      featuredCapacity: 5,
      featuredEnabled: true,
      featuredPositionPricing: [{ position: 1, price: 100 }],
      status: 'active',
      defaultFeaturedImageFile: file,
    })

    expect(formData.get('data')).toBe(
      JSON.stringify({
        country: 'Bangladesh',
        countryCode: 'BD',
        city: 'Chatto',
        latitude: 23.8103,
        longitude: 91.4125,
        featuredCapacity: 5,
        featuredEnabled: true,
        featuredPositionPricing: [{ position: 1, price: 100 }],
        status: 'active',
      }),
    )
    expect(formData.get('defaultFeaturedImage')).toBe(file)
  })
})
