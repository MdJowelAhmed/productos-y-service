import { Country, City } from 'country-state-city'

export interface LocationCountry {
  name: string
  isoCode: string
}

export interface LocationCity {
  key: string
  name: string
  stateCode: string
  latitude: string
  longitude: string
}

function cityKey(name: string, stateCode: string, latitude: string, longitude: string) {
  return `${name}|${stateCode}|${latitude}|${longitude}`
}

export function getCountries(): LocationCountry[] {
  return Country.getAllCountries()
    .map((country) => ({ name: country.name, isoCode: country.isoCode }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export function findCountry(isoOrName: string): LocationCountry | undefined {
  const query = isoOrName.trim().toLowerCase()
  if (!query) return undefined
  return getCountries().find(
    (country) => country.isoCode.toLowerCase() === query || country.name.toLowerCase() === query,
  )
}

export function getCitiesByCountry(isoCode: string): LocationCity[] {
  if (!isoCode) return []
  const cities = City.getCitiesOfCountry(isoCode) || []
  return cities
    .filter((city) => city.latitude && city.longitude)
    .map((city) => ({
      key: cityKey(city.name, city.stateCode || '', String(city.latitude), String(city.longitude)),
      name: city.name,
      stateCode: city.stateCode || '',
      latitude: String(city.latitude),
      longitude: String(city.longitude),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.stateCode.localeCompare(b.stateCode))
}

export function findCity(isoCode: string, cityName: string): LocationCity | undefined {
  const query = cityName.trim().toLowerCase()
  if (!isoCode || !query) return undefined
  return getCitiesByCountry(isoCode).find((city) => city.name.toLowerCase() === query)
}

export function makeCustomCity(
  name: string,
  latitude: string | number,
  longitude: string | number,
): LocationCity {
  const lat = String(latitude)
  const lng = String(longitude)
  return {
    key: cityKey(name, 'custom', lat, lng),
    name,
    stateCode: '',
    latitude: lat,
    longitude: lng,
  }
}

export function getCitySelectOptions(cities: LocationCity[]) {
  const nameCounts = cities.reduce<Record<string, number>>((acc, city) => {
    acc[city.name] = (acc[city.name] || 0) + 1
    return acc
  }, {})

  return cities.map((city) => ({
    label:
      nameCounts[city.name] > 1 && city.stateCode ? `${city.name} (${city.stateCode})` : city.name,
    value: city.key,
  }))
}
