"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import StepIndicator from "@/components/host/StepIndicator";
import PropertyType from "@/components/host/steps/PropertyType";
import Location from "@/components/host/steps/Location";
import GuestDetails from "@/components/host/steps/GuestDetails";
import Amenities from "@/components/host/steps/Amenities";
import Photos from "@/components/host/steps/Photos";
import TitleDescription from "@/components/host/steps/TitleDescription";
import Pricing from "@/components/host/steps/Pricing";
import HouseRules from "@/components/host/steps/HouseRules";
import { useAuthStore } from "@/store/authStore";
import { motion } from "framer-motion";

export default function CreateListingPage() {
  const router = useRouter();
  const { updateUser, user, isAuthenticated, hasHydrated } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const totalSteps = 8;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace("/auth/login?next=/become-a-host/create");
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return null;
  }

  const [formData, setFormData] = useState({
    // Step 1: Property Type
    category: "",

    // Step 2: Location
    country: "",
    location: "",
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
    },
    geometry: {
      type: "Point",
      coordinates: [0, 0],
    },

    // Step 3: Guest Details
    maxGuests: 1,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,

    // Step 4: Amenities
    amenities: [],

    // Step 5: Photos
    images: [],

    // Step 6: Title & Description
    title: "",
    description: "",

    // Step 7: Pricing
    pricePerNight: 0,
    cleaningFee: 0,
    serviceFee: 0,
    tax: 0,

    // Step 8: House Rules
    houseRules: [],
    cancellationPolicy: "moderate",
  });

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateNestedFormData = (parent: string, field: string, value: any) => {
    setFormData((prev) => {
      const parentObj = prev[parent as keyof typeof prev] as Record<string, any>;
      return {
        ...prev,
        [parent]: { ...parentObj, [field]: value },
      };
    });
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1 && !formData.category) {
      alert("Please select a property type");
      return;
    }
    if (currentStep === 2 && (!formData.location || !formData.country)) {
      alert("Please enter location and country");
      return;
    }
    if (currentStep === 5 && formData.images.length === 0) {
      alert("Please add at least one photo");
      return;
    }
    if (currentStep === 6 && (!formData.title || !formData.description)) {
      alert("Please enter title and description");
      return;
    }
    if (currentStep === 7 && formData.pricePerNight === 0) {
      alert("Please set a price per night");
      return;
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Get auth token from localStorage
      const authData = localStorage.getItem("airlite-auth");
      if (!authData) {
        alert("You must be logged in to create a listing");
        router.push("/auth/login");
        return;
      }

      const { token } = JSON.parse(authData).state;
      
      // Prepare FormData for file upload
      const submitData = new FormData();
      
      // Add all text fields
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("category", formData.category);
      submitData.append("country", formData.country);
      submitData.append("location", formData.location);
      
      // Add address as JSON string
      submitData.append("address", JSON.stringify(formData.address));
      
      // Add numbers
      submitData.append("pricePerNight", formData.pricePerNight.toString());
      submitData.append("cleaningFee", formData.cleaningFee.toString());
      submitData.append("serviceFee", formData.serviceFee.toString());
      submitData.append("tax", formData.tax.toString());
      submitData.append("maxGuests", formData.maxGuests.toString());
      submitData.append("bedrooms", formData.bedrooms.toString());
      submitData.append("beds", formData.beds.toString());
      submitData.append("bathrooms", formData.bathrooms.toString());
      
      // Add arrays
      formData.amenities.forEach(amenity => submitData.append("amenities[]", amenity));
      formData.houseRules.forEach(rule => submitData.append("houseRules[]", rule));
      
      // Add cancellation policy
      submitData.append("cancellationPolicy", formData.cancellationPolicy);
      
      // Add image files if any
      formData.images.forEach((image: any) => {
        if (image.file instanceof File) {
          submitData.append("images", image.file);
        }
      });

      const response = await fetch("http://localhost:8080/api/listings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create listing");
      }

      // Update user role in store if it was changed from guest to both
      if (user && user.role === "guest") {
        updateUser({ ...user, role: "both" });
      }

      alert("Listing created successfully!");
      router.push("/dashboard/properties");
    } catch (error: any) {
      console.error("Error submitting listing:", error);
      alert(error.message || "Failed to create listing. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <PropertyType
            category={formData.category}
            setCategory={(value) => updateFormData("category", value)}
          />
        );
      case 2:
        return (
          <Location
            country={formData.country}
            location={formData.location}
            address={formData.address}
            setCountry={(value) => updateFormData("country", value)}
            setLocation={(value) => updateFormData("location", value)}
            setAddress={(field, value) =>
              updateNestedFormData("address", field, value)
            }
            setGeometry={(value) => updateFormData("geometry", value)}
          />
        );
      case 3:
        return (
          <GuestDetails
            maxGuests={formData.maxGuests}
            bedrooms={formData.bedrooms}
            beds={formData.beds}
            bathrooms={formData.bathrooms}
            setMaxGuests={(value) => updateFormData("maxGuests", value)}
            setBedrooms={(value) => updateFormData("bedrooms", value)}
            setBeds={(value) => updateFormData("beds", value)}
            setBathrooms={(value) => updateFormData("bathrooms", value)}
          />
        );
      case 4:
        return (
          <Amenities
            amenities={formData.amenities}
            setAmenities={(value) => updateFormData("amenities", value)}
          />
        );
      case 5:
        return (
          <Photos
            images={formData.images}
            setImages={(value) => updateFormData("images", value)}
          />
        );
      case 6:
        return (
          <TitleDescription
            title={formData.title}
            description={formData.description}
            setTitle={(value) => updateFormData("title", value)}
            setDescription={(value) => updateFormData("description", value)}
          />
        );
      case 7:
        return (
          <Pricing
            pricePerNight={formData.pricePerNight}
            cleaningFee={formData.cleaningFee}
            serviceFee={formData.serviceFee}
            tax={formData.tax}
            setPricePerNight={(value) => updateFormData("pricePerNight", value)}
            setCleaningFee={(value) => updateFormData("cleaningFee", value)}
            setServiceFee={(value) => updateFormData("serviceFee", value)}
            setTax={(value) => updateFormData("tax", value)}
          />
        );
      case 8:
        return (
          <HouseRules
            houseRules={formData.houseRules}
            cancellationPolicy={formData.cancellationPolicy}
            setHouseRules={(value) => updateFormData("houseRules", value)}
            setCancellationPolicy={(value) =>
              updateFormData("cancellationPolicy", value)
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 26, stiffness: 260 }}
      className="min-h-screen bg-white"
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-gray-700 rounded-full border p-2 cursor-pointer hover:bg-gray-100 px-3 hover:text-gray-900"
          >
            Exit
          </button>
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} />
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-24 pb-32 px-8">
        <div className="max-w-2xl mx-auto">{renderStep()}</div>
      </div>

      {/* Footer Navigation */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="flex items-center cursor-pointer gap-2 px-6 py-3 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed underline"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={currentStep === totalSteps ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex items-center cursor-pointer gap-2 px-8 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Submitting..." : (currentStep === totalSteps ? "Submit" : "Next")}
            {currentStep < totalSteps && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </footer>
    </motion.div>
  );
}
