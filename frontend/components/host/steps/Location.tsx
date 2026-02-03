import { useEffect, useRef, useState } from "react";
import { listingsAPI } from "@/lib/listings";

export default function Location({
  country,
  location,
  address,
  setCountry,
  setLocation,
  setAddress,
  setGeometry,
}: {
  country: string;
  location: string;
  address: { street: string; city: string; state: string; zipCode: string };
  setCountry: (value: string) => void;
  setLocation: (value: string) => void;
  setAddress: (field: string, value: string) => void;
  setGeometry: (value: any) => void;
}) {
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const lastLookupRef = useRef("");

  useEffect(() => {
    const zipCode = address.zipCode.trim();
    const city = address.city.trim();
    const state = address.state.trim();
    const countryValue = country.trim();

    const lookupByZip = zipCode.length >= 4;
    const lookupByCityState = !zipCode && Boolean(city && state);

    if (!lookupByZip && !lookupByCityState) {
      return;
    }

    const lookupKey = lookupByZip
      ? `zip:${zipCode}|${countryValue}`
      : `city:${city}|${state}|${countryValue}`;

    if (lastLookupRef.current === lookupKey) {
      return;
    }

    const timer = setTimeout(async () => {
      lastLookupRef.current = lookupKey;
      setIsAutoFilling(true);
      try {
        const data = await listingsAPI.addressLookup({
          zipCode: lookupByZip ? zipCode : undefined,
          city: lookupByCityState ? city : undefined,
          state: lookupByCityState ? state : undefined,
          country: countryValue || undefined,
        });

        if (data?.zipCode) {
          setAddress("zipCode", data.zipCode);
        }
        if (data?.city) {
          setAddress("city", data.city);
        }
        if (data?.state) {
          setAddress("state", data.state);
        }
      } catch (error) {
        console.error("Address lookup failed:", error);
      } finally {
        setIsAutoFilling(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [address.zipCode, address.city, address.state, country, setAddress]);

  const isZipLocked = address.zipCode.trim().length >= 4;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Where's your place located?
        </h1>
        <p className="text-lg text-gray-600">
          Your address is only shared with guests after they've made a reservation
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country/Region
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="India"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City/Location
          </label>
          <input
            type="text"
            value={location}
            disabled={isZipLocked}
            onChange={(e) => {
              setLocation(e.target.value);
              setAddress("city", e.target.value);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Mumbai"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address
          </label>
          <input
            type="text"
            value={address.street}
            onChange={(e) => setAddress("street", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="123 Main St"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State
          </label>
          <input
            type="text"
            value={address.state}
            onChange={(e) => setAddress("state", e.target.value)}
            disabled={isZipLocked}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="Maharashtra"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            ZIP Code
          </label>
          <input
            type="text"
            value={address.zipCode}
            onChange={(e) => setAddress("zipCode", e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            placeholder="400001"
          />
          {isAutoFilling && (
            <p className="text-xs text-gray-500 mt-2">Auto-filling address…</p>
          )}
        </div>
      </div>
    </div>
  );
}
