"use client";

import { useState } from "react";
import { SearchForm } from "./search-form";
import { UserDetails } from "./user-details";

export default function BillingAdminPage() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Billing</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Form */}
        <div className="lg:col-span-1">
          <SearchForm onUserSelect={setSelectedUserId} />
        </div>

        {/* User Details */}
        <div className="lg:col-span-2">
          {selectedUserId ? (
            <UserDetails userId={selectedUserId} />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Select a user to view their billing details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
