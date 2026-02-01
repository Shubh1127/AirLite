"use client";
import React from "react";
import HostCard from "@/components/host/HostCard";
import { useAuthStore } from "@/store/authStore";

const page = () => {
  const { user } = useAuthStore();

  if (user?.role !== "host") {
    return (
      <div className="flex h-full">
        
        {/* LEFT SECTION */}
        <div className="w-1/2 flex items-center justify-center">
          <h1 className="text-5xl font-semibold leading-tight">
            It’s easy to get<br /> started on Airbnb
          </h1>
        </div>

        {/* RIGHT SECTION */}
        <div className="w-1/2 flex flex-col justify-center gap-6 px-6 pr-12">
          <HostCard
            headline="Tell us about your place"
            description="Share some basic info, such as where it is and how many guests can stay."
            imgUrl="https://a0.muscache.com/im/pictures/da2e1a40-a92b-449e-8575-d8208cc5d409.jpg?im_w=240"
          />
          <hr/>
          <HostCard
            headline="Make it stand out"
            description="Add 5 or more photos plus a title and description – we’ll help you out."
            imgUrl="https://a0.muscache.com/im/pictures/bfc0bc89-58cb-4525-a26e-7b23b750ee00.jpg?im_w=240"
          />
          <hr/>
          <HostCard
            headline="Finish up and publish"
            description="Choose a starting price, verify a few details, then publish your listing."
            imgUrl="https://a0.muscache.com/im/pictures/c0634c73-9109-4710-8968-3e927df1191c.jpg?im_w=240"
          />

        </div>

      </div>
    );
  }

  return <div>page</div>;
};

export default page;
