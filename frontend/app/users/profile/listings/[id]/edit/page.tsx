'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import Link from 'next/link';

export default function EditListingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    country: '',
    location: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    pricePerNight: 0,
    cleaningFee: 0,
    serviceFee: 0,
    tax: 0,
    maxGuests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: [] as string[],
    houseRules: [] as string[],
    cancellationPolicy: 'moderate',
    isAvailable: true,
  });

  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [newImages, setNewImages] = useState<any[]>([]);

  const categories = [
    'beach', 'mountain', 'city', 'lake', 'desert', 
    'luxury', 'historic', 'nature', 'cottage'
  ];

  const popularAmenities = [
    'wifi', 'kitchen', 'parking', 'air conditioning', 'heating',
    'pool', 'hot tub', 'gym', 'tv', 'washer',
    'dryer', 'fireplace', 'balcony', 'garden', 'bbq grill'
  ];

  useEffect(() => {
    fetchListing();
  }, [params.id]);

  const fetchListing = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/listings/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        
        setFormData({
          title: data.title || '',
          description: data.description || '',
          category: data.category || '',
          country: data.country || '',
          location: data.location || '',
          address: data.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
          pricePerNight: data.pricePerNight || 0,
          cleaningFee: data.cleaningFee || 0,
          serviceFee: data.serviceFee || 0,
          tax: data.tax || 0,
          maxGuests: data.maxGuests || 1,
          bedrooms: data.bedrooms || 1,
          beds: data.beds || 1,
          bathrooms: data.bathrooms || 1,
          amenities: data.amenities || [],
          houseRules: data.houseRules || [],
          cancellationPolicy: data.cancellationPolicy || 'moderate',
          isAvailable: data.isAvailable !== false,
        });

        setExistingImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [field]: value }
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleNewImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const images = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      filename: file.name,
    }));

    setNewImages(prev => [...prev, ...images]);
  };

  const removeNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const authData = localStorage.getItem('airlite-auth');
      if (!authData) {
        alert('You must be logged in');
        return;
      }

      const { token } = JSON.parse(authData).state;

      const submitData = new FormData();
      
      // Add all text/number fields
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('category', formData.category);
      submitData.append('country', formData.country);
      submitData.append('location', formData.location);
      submitData.append('address', JSON.stringify(formData.address));
      submitData.append('pricePerNight', formData.pricePerNight.toString());
      submitData.append('cleaningFee', formData.cleaningFee.toString());
      submitData.append('serviceFee', formData.serviceFee.toString());
      submitData.append('tax', formData.tax.toString());
      submitData.append('maxGuests', formData.maxGuests.toString());
      submitData.append('bedrooms', formData.bedrooms.toString());
      submitData.append('beds', formData.beds.toString());
      submitData.append('bathrooms', formData.bathrooms.toString());
      submitData.append('isAvailable', formData.isAvailable.toString());
      submitData.append('cancellationPolicy', formData.cancellationPolicy);

      // Add arrays
      formData.amenities.forEach(amenity => submitData.append('amenities[]', amenity));
      formData.houseRules.forEach(rule => submitData.append('houseRules[]', rule));

      // Add new image files
      newImages.forEach(image => {
        if (image.file instanceof File) {
          submitData.append('images', image.file);
        }
      });

      const response = await fetch(`http://localhost:8080/api/listings/${params.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update listing');
      }

      alert('Listing updated successfully!');
      router.push('/users/profile/listings');
    } catch (error: any) {
      console.error('Error updating listing:', error);
      alert(error.message || 'Failed to update listing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Loading listing...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/users/profile/listings"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Edit listing</h1>
          <p className="text-gray-600 mt-1">Update your property details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              required
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAvailable}
                onChange={(e) => handleChange('isAvailable', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Available for booking</span>
            </label>
          </div>
        </div>

        {/* Location */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Location</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleChange('country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location/City *
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <input
              type="text"
              value={formData.address.street}
              onChange={(e) => handleAddressChange('street', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleAddressChange('state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code
              </label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Guest Details */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Guest Details</h2>
          
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Guests
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxGuests}
                onChange={(e) => handleChange('maxGuests', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bedrooms
              </label>
              <input
                type="number"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => handleChange('bedrooms', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Beds
              </label>
              <input
                type="number"
                min="1"
                value={formData.beds}
                onChange={(e) => handleChange('beds', parseInt(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bathrooms
              </label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={formData.bathrooms}
                onChange={(e) => handleChange('bathrooms', parseFloat(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Pricing</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Night *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.pricePerNight}
                  onChange={(e) => handleChange('pricePerNight', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleaning Fee
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.cleaningFee}
                  onChange={(e) => handleChange('cleaningFee', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Fee
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.serviceFee}
                  onChange={(e) => handleChange('serviceFee', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tax
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600">$</span>
                <input
                  type="number"
                  min="0"
                  value={formData.tax}
                  onChange={(e) => handleChange('tax', parseFloat(e.target.value))}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Amenities</h2>
          
          <div className="grid grid-cols-3 gap-3">
            {popularAmenities.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-3 rounded-lg border-2 text-left transition ${
                  formData.amenities.includes(amenity)
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {amenity.charAt(0).toUpperCase() + amenity.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Images</h2>
          
          {existingImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Current Images</h3>
              <div className="grid grid-cols-4 gap-4">
                {existingImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={`Property ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {newImages.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">New Images to Upload</h3>
              <div className="grid grid-cols-4 gap-4">
                {newImages.map((image, index) => (
                  <div key={index} className="relative aspect-square">
                    <img
                      src={image.url}
                      alt={`New ${index + 1}`}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition">
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <div className="text-sm font-medium text-gray-900">Add more photos</div>
              <div className="text-xs text-gray-500 mt-1">Click to browse</div>
            </div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleNewImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Cancellation Policy */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Cancellation Policy</h2>
          
          <select
            value={formData.cancellationPolicy}
            onChange={(e) => handleChange('cancellationPolicy', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="flexible">Flexible - Full refund 1 day prior</option>
            <option value="moderate">Moderate - Full refund 5 days prior</option>
            <option value="strict">Strict - Full refund 14 days prior</option>
          </select>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <Link
            href="/users/profile/listings"
            className="px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
